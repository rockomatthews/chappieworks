import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { SEEDANCE_MODEL } from "../../../lib/seedance";
import { screenForAdult } from "../../../lib/moderation";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import { mkdtemp, rm, readFile, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import {
  newJobId,
  writeState,
  type MovieMode,
  type MovieState,
} from "../../../lib/movies";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

const MAX_PROMPT_LEN = 800;
const MIN_PROMPT_LEN = 10;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

// Generation runs on Seedance 2.0 (seedance2.ai) — native audio, up to 1080p,
// 5s or 10s clips. We keep our own adult-content pre-screen (lib/moderation) so
// NSFW never reaches the backend; violence/action/dark themes are allowed.

// Pull the last frame from a video at a public URL and return it as a PNG
// buffer. Used by extension mode to seed the next 10s with the final frame
// of the user's uploaded clip, so motion + scene continue cleanly.
async function extractLastFrame(videoUrl: string): Promise<Buffer> {
  const workDir = await mkdtemp(path.join(tmpdir(), "movie-frame-"));
  const inPath = path.join(workDir, "input.mp4");
  const outPath = path.join(workDir, "last.png");
  try {
    const res = await fetch(videoUrl);
    if (!res.ok) throw new Error(`video fetch failed ${res.status}`);
    const ab = await res.arrayBuffer();
    await writeFile(inPath, Buffer.from(ab));

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("frame extract timeout (30s)")),
        30000,
      );
      ffmpeg(inPath)
        // -sseof seeks from the end. -1s grabs the final visible frame
        // reliably across codecs without needing to know the duration.
        .inputOptions(["-sseof -1"])
        .outputOptions(["-vsync 0", "-q:v 2", "-frames:v 1"])
        .on("end", () => {
          clearTimeout(timeout);
          resolve();
        })
        .on("error", (err) => {
          clearTimeout(timeout);
          reject(err);
        })
        .save(outPath);
    });

    return await readFile(outPath);
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

// Seedance requires every side of the start image to be 300–6000px. Buyers
// upload 256px logos and the like, so normalize server-side: if the short side
// is under 300px, upscale (lanczos) so it lands at 640px; if the long side is
// over 6000px, downscale so it lands at 4096px. Aspect is preserved and
// in-range images pass through untouched. Always re-encodes to PNG, which also
// normalizes WebP inputs.
async function normalizeStartImage(input: Buffer): Promise<Buffer> {
  const workDir = await mkdtemp(path.join(tmpdir(), "movie-img-"));
  const inPath = path.join(workDir, "in.img");
  const outPath = path.join(workDir, "out.png");
  try {
    await writeFile(inPath, input);
    const scaleExpr =
      "scale=" +
      "w='if(lt(min(iw,ih),300),trunc(iw*640/min(iw,ih)/2)*2," +
      "if(gt(max(iw,ih),6000),trunc(iw*4096/max(iw,ih)/2)*2,iw))':" +
      "h='if(lt(min(iw,ih),300),trunc(ih*640/min(iw,ih)/2)*2," +
      "if(gt(max(iw,ih),6000),trunc(ih*4096/max(iw,ih)/2)*2,ih))':" +
      "flags=lanczos";
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("image normalize timeout (30s)")),
        30000,
      );
      ffmpeg(inPath)
        .outputOptions(["-vf", scaleExpr, "-frames:v 1"])
        .on("end", () => {
          clearTimeout(timeout);
          resolve();
        })
        .on("error", (err) => {
          clearTimeout(timeout);
          reject(err);
        })
        .save(outPath);
    });
    return await readFile(outPath);
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  let prompt = "";
  let email = "";
  let imageFile: File | null = null;
  let inputVideoUrl: string | undefined;
  let duration = 5;
  let tier: "standard" | "raw" = "standard";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    prompt = String(form.get("prompt") ?? "").trim();
    email = String(form.get("email") ?? "").trim().toLowerCase();
    const rawDuration = Number(form.get("duration") ?? 5);
    duration = rawDuration === 10 ? 10 : 5;
    if (String(form.get("tier") ?? "") === "raw") tier = "raw";
    const maybeImage = form.get("image");
    if (maybeImage instanceof File && maybeImage.size > 0) {
      imageFile = maybeImage;
    }
    const maybeVideoUrl = String(form.get("inputVideoUrl") ?? "").trim();
    if (maybeVideoUrl) inputVideoUrl = maybeVideoUrl;
  } else {
    try {
      const body = (await req.json()) as {
        prompt?: string;
        email?: string;
        duration?: number;
        inputVideoUrl?: string;
        tier?: string;
      };
      prompt = (body.prompt ?? "").trim();
      email = (body.email ?? "").trim().toLowerCase();
      duration = body.duration === 10 ? 10 : 5;
      if (body.tier === "raw") tier = "raw";
      if (body.inputVideoUrl) inputVideoUrl = body.inputVideoUrl;
    } catch {
      return NextResponse.json({ error: "invalid request body" }, { status: 400 });
    }
  }

  if (!prompt || prompt.length < MIN_PROMPT_LEN) {
    return NextResponse.json(
      { error: `prompt must be at least ${MIN_PROMPT_LEN} characters` },
      { status: 400 },
    );
  }
  if (prompt.length > MAX_PROMPT_LEN) {
    return NextResponse.json(
      { error: `prompt must be under ${MAX_PROMPT_LEN} characters` },
      { status: 400 },
    );
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "valid email is required" },
      { status: 400 },
    );
  }

  // Can't both extend a video AND seed with an image — extension mode IS an
  // image-to-video under the hood (last-frame seed). Reject mixed mode.
  if (imageFile && inputVideoUrl) {
    return NextResponse.json(
      { error: "upload either an image or a video, not both" },
      { status: 400 },
    );
  }

  if (imageFile) {
    if (!ALLOWED_IMAGE_TYPES.has(imageFile.type)) {
      return NextResponse.json(
        { error: "reference image must be PNG, JPG, or WebP" },
        { status: 400 },
      );
    }
    if (imageFile.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "reference image must be under 4 MB" },
        { status: 400 },
      );
    }
  }

  // Extension mode is fixed at 10s — the cadence is the directorial lever.
  // Force it regardless of the form value so we never silently shorten.
  if (inputVideoUrl) {
    duration = 10;
  }

  if (!process.env.SEEDANCE_API_KEY) {
    console.error("[chappieworks:movie] SEEDANCE_API_KEY missing");
    return NextResponse.json(
      { error: "generator offline — try again shortly" },
      { status: 503 },
    );
  }

  const jobId = newJobId();

  let startImageUrl: string | undefined;
  let mode: MovieMode = "text";

  // Path A: explicit image upload → image-to-video.
  if (imageFile) {
    mode = "image";
    try {
      const raw = Buffer.from(await imageFile.arrayBuffer());
      const buf = await normalizeStartImage(raw);
      const blob = await put(`movie/${jobId}/start.png`, buf, {
        access: "public",
        contentType: "image/png",
      });
      startImageUrl = blob.url;
    } catch (err) {
      console.error("[chappieworks:movie] image upload failed", err);
      return NextResponse.json(
        { error: "couldn't process the beginning image — try a different file" },
        { status: 500 },
      );
    }
  }

  // Path B: video URL (extension mode) → extract last frame, use as seed.
  if (inputVideoUrl) {
    mode = "video";
    try {
      const frame = await normalizeStartImage(
        await extractLastFrame(inputVideoUrl),
      );
      const blob = await put(`movie/${jobId}/last-frame.png`, frame, {
        access: "public",
        contentType: "image/png",
      });
      startImageUrl = blob.url;
      console.log(
        "[chappieworks:movie] extracted last frame",
        jobId,
        "from",
        inputVideoUrl,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown";
      console.error(
        "[chappieworks:movie] last-frame extraction failed",
        jobId,
        message,
      );
      return NextResponse.json(
        {
          error:
            "couldn't read the last frame of that video — try a shorter MP4 or different format",
        },
        { status: 502 },
      );
    }
  }

  // All video runs on Seedance 2.0, and Seedance bills credits PER RENDER —
  // so nothing is submitted until the buyer pays (pay-first). This route only
  // validates + records the brief. We still screen adult content on every
  // prompt BEFORE taking money (violence/gore/dark themes are fine — that's
  // the point) so NSFW never reaches checkout or the backend, keeping
  // Stripe/brand safe. `tier` is retained for the UI but doesn't change the
  // backend.
  const screen = await screenForAdult(prompt, startImageUrl);
  if (screen.blocked) {
    return NextResponse.json({ error: screen.reason }, { status: 400 });
  }

  try {
    // Seedance durations are 5s/10s. Map our 5/10 directly.
    const seconds = duration >= 7 ? 10 : 5;

    const state: MovieState = {
      jobId,
      prompt,
      email,
      createdAt: new Date().toISOString(),
      status: "awaiting_payment",
      paid: false,
      durationSec: seconds,
      mode,
      startImageUrl,
      inputVideoUrl,
    };
    await writeState(state);

    console.log(
      "[chappieworks:movie] brief recorded (awaiting payment)",
      jobId,
      "model",
      SEEDANCE_MODEL,
      "tier",
      tier,
      "mode",
      mode,
      "seconds",
      seconds,
    );

    return NextResponse.json({ jobId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[chappieworks:movie] record brief failed", message);
    return NextResponse.json(
      { error: `couldn't start: ${message}` },
      { status: 502 },
    );
  }
}
