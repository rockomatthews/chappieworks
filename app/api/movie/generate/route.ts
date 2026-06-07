import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import {
  falSubmit,
  KLING_TEXT_TO_VIDEO,
  KLING_IMAGE_TO_VIDEO,
  WAN_TEXT_TO_VIDEO,
  WAN_IMAGE_TO_VIDEO,
} from "../../../lib/fal";
import { screenForAdult } from "../../../lib/moderation";
import {
  atlasSubmit,
  ATLAS_TEXT_TO_VIDEO,
  ATLAS_IMAGE_TO_VIDEO,
} from "../../../lib/atlas";
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

// Generation runs on Kling (Kling 2.1 Master) via fal.ai — high quality, native
// ~1080p, permissive content policy, and much faster/cheaper than Sora (which
// OpenAI is discontinuing). Kling supports 5s or 10s clips.

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

  if (!process.env.FAL_KEY) {
    console.error("[chappieworks:movie] FAL_KEY missing");
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
      const ext = imageFile.name.split(".").pop()?.toLowerCase() ?? "png";
      const buf = Buffer.from(await imageFile.arrayBuffer());
      const blob = await put(`movie/${jobId}/start.${ext}`, buf, {
        access: "public",
        contentType: imageFile.type,
      });
      startImageUrl = blob.url;
    } catch (err) {
      console.error("[chappieworks:movie] image upload failed", err);
      return NextResponse.json(
        { error: "couldn't upload reference image — try a smaller file" },
        { status: 500 },
      );
    }
  }

  // Path B: video URL (extension mode) → extract last frame, use as seed.
  if (inputVideoUrl) {
    mode = "video";
    try {
      const frame = await extractLastFrame(inputVideoUrl);
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

  // Raw tier runs on an unmoderated backend — block adult prompts ourselves
  // (violence is fine). Keeps NSFW out and Stripe/brand safe.
  if (tier === "raw") {
    const screen = await screenForAdult(prompt, startImageUrl);
    if (screen.blocked) {
      return NextResponse.json({ error: screen.reason }, { status: 400 });
    }
  }

  try {
    const seconds = duration >= 7 ? "10" : "5";

    // Raw tier → Atlas Cloud (uncensored backend; cinematic violence renders).
    // Requires ATLAS_API_KEY. Without it, we fall through to fal's Wan below,
    // which moderates — so violence may be blocked. Adult prompts were already
    // screened out above, so anything reaching Atlas is non-sexual.
    if (tier === "raw" && process.env.ATLAS_API_KEY) {
      try {
        const atlasModel = startImageUrl
          ? ATLAS_IMAGE_TO_VIDEO
          : ATLAS_TEXT_TO_VIDEO;
        const atlasInput: Record<string, unknown> = {
          prompt,
          aspect_ratio: "16:9",
          duration: duration >= 7 ? 10 : 5,
        };
        if (startImageUrl) atlasInput.image_url = startImageUrl;

        const { taskId } = await atlasSubmit(atlasModel, atlasInput);
        const state: MovieState = {
          jobId,
          prompt,
          email,
          createdAt: new Date().toISOString(),
          atlasTaskId: taskId,
          status: "generating",
          paid: false,
          durationSec: Number(seconds),
          mode,
          startImageUrl,
          inputVideoUrl,
        };
        await writeState(state);
        console.log(
          "[chappieworks:movie] created job",
          jobId,
          "atlas",
          taskId,
          "model",
          atlasModel,
          "mode",
          mode,
        );
        return NextResponse.json({ jobId });
      } catch (err) {
        // Atlas key invalid / outage → fall back to fal's Wan so Raw still
        // renders (moderated). Auto-upgrades to uncensored once the key works.
        console.error(
          "[chappieworks:movie] atlas submit failed, falling back to fal Wan",
          jobId,
          err instanceof Error ? err.message : err,
        );
      }
    }

    let model: string;
    const input: Record<string, unknown> = { prompt, aspect_ratio: "16:9" };
    if (tier === "raw") {
      // Wan 2.2 — open model, far fewer content filters. Duration via frames
      // (~24fps): 121 ≈ 5s, 161 ≈ ~6.7s (Wan's max).
      model = startImageUrl ? WAN_IMAGE_TO_VIDEO : WAN_TEXT_TO_VIDEO;
      input.resolution = "720p";
      input.num_frames = duration >= 7 ? 161 : 121;
      input.enable_prompt_expansion = true;
    } else {
      // Kling 2.1 Master — high quality, native 1080p.
      model = startImageUrl ? KLING_IMAGE_TO_VIDEO : KLING_TEXT_TO_VIDEO;
      input.duration = seconds;
      input.negative_prompt = "blur, distort, and low quality";
      input.cfg_scale = 0.5;
    }
    if (startImageUrl) {
      input.image_url = startImageUrl;
    }

    const sub = await falSubmit(model, input);

    const state: MovieState = {
      jobId,
      prompt,
      email,
      createdAt: new Date().toISOString(),
      falRequestId: sub.requestId,
      falStatusUrl: sub.statusUrl,
      falResultUrl: sub.resultUrl,
      status: "generating",
      paid: false,
      durationSec: Number(seconds),
      mode,
      startImageUrl,
      inputVideoUrl,
    };
    await writeState(state);

    console.log(
      "[chappieworks:movie] created job",
      jobId,
      "kling",
      sub.requestId,
      "mode",
      mode,
      "seconds",
      seconds,
    );

    return NextResponse.json({ jobId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[chappieworks:movie] create sora video failed", message);
    return NextResponse.json(
      { error: `couldn't start generation: ${message}` },
      { status: 502 },
    );
  }
}
