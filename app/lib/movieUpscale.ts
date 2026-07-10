import { put } from "@vercel/blob";
import Replicate from "replicate";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import { mkdtemp, rm, readFile, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { HD_KEY, readState, writeState } from "./movies";
import { sendCleanMovieEmail } from "./movieEmail";

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

// Produces the 1080p paid deliverable from the (720p) preview-quality clip —
// at PURCHASE time, so we only spend on actual sales. Prefers an AI upscaler
// (Real-ESRGAN-class model on Replicate, set REPLICATE_VIDEO_UPSCALE_MODEL),
// and falls back to a high-quality ffmpeg "boost" (lanczos + light sharpen) so
// a buyer always gets a 1080p MP4 even if the AI path is unset or fails.

async function downloadToBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function aiUpscale(sourceUrl: string): Promise<Buffer | null> {
  const model = process.env.REPLICATE_VIDEO_UPSCALE_MODEL;
  const token = process.env.REPLICATE_API_TOKEN;
  if (!model || !token) return null;
  try {
    const replicate = new Replicate({ auth: token });
    // Most video-upscale models accept { video, scale|resolution }. We pass a
    // generous input and read a URL out of the output.
    const output = (await replicate.run(model as `${string}/${string}`, {
      input: { video: sourceUrl, scale: 2 },
    })) as unknown;
    const url =
      typeof output === "string"
        ? output
        : Array.isArray(output) && typeof output[0] === "string"
          ? (output[0] as string)
          : typeof (output as { output?: unknown })?.output === "string"
            ? ((output as { output: string }).output)
            : null;
    if (!url) return null;
    return await downloadToBuffer(url);
  } catch (err) {
    console.error(
      "[chappieworks:upscale] AI upscale failed, falling back to ffmpeg",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

async function ffmpegBoost(sourceUrl: string): Promise<Buffer> {
  const input = await downloadToBuffer(sourceUrl);
  const workDir = await mkdtemp(path.join(tmpdir(), "movie-hd-"));
  const inPath = path.join(workDir, "in.mp4");
  const outPath = path.join(workDir, "out.mp4");
  try {
    await writeFile(inPath, input);
    return await new Promise<Buffer>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("hd boost timeout (120s)")),
        120000,
      );
      ffmpeg(inPath)
        // Upscale to 1080p + a light unsharp mask so it reads crisper than a
        // plain stretch.
        .videoFilters("scale=1920:1080:flags=lanczos,unsharp=5:5:0.8:5:5:0.0")
        .outputOptions(["-c:a copy", "-preset veryfast", "-crf 18"])
        .on("end", async () => {
          clearTimeout(timeout);
          try {
            resolve(await readFile(outPath));
          } catch (err) {
            reject(err);
          }
        })
        .on("error", (err) => {
          clearTimeout(timeout);
          reject(err);
        })
        .save(outPath);
    });
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

// Returns the public URL of the stored 1080p deliverable.
export async function produceHd(
  jobId: string,
  sourceUrl: string,
): Promise<string> {
  let hd = await aiUpscale(sourceUrl);
  if (!hd) hd = await ffmpegBoost(sourceUrl);
  const blob = await put(HD_KEY(jobId), hd, {
    access: "public",
    contentType: "video/mp4",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return blob.url;
}

// Called at purchase time (webhook + bypass): upscale the 720p clean to 1080p,
// persist hdUrl, and email the buyer the 1080p link. Idempotent — re-entry sees
// an existing hdUrl and skips. Best-effort; logs on failure.
export async function deliverMovieHd(
  jobId: string,
  opts: { bypass?: boolean } = {},
): Promise<void> {
  const state = await readState(jobId);
  if (!state || !state.cleanUrl) {
    console.error(
      "[chappieworks:movie] deliverMovieHd: state/cleanUrl missing",
      jobId,
      "hasState",
      !!state,
    );
    return;
  }
  if (state.hdUrl) return; // already done
  console.log(
    "[chappieworks:movie] deliverMovieHd start",
    jobId,
    "→",
    state.email,
  );

  // Veo renders native 1080p with audio, so the clean clip IS the deliverable —
  // no upscale needed (and no fragile serverless-ffmpeg dependency). produceHd
  // remains available for sources that genuinely need it.
  const hdUrl = state.cleanUrl;

  // Force paid:true — deliverMovieHd only runs post-payment (webhook/bypass), so
  // a stale read here must not clobber the paid flag the checkout just wrote
  // (else /m/[jobId] re-shows the paywall to a buyer who already paid).
  const fresh = (await readState(jobId)) ?? state;
  await writeState({
    ...fresh,
    paid: true,
    paidAt: fresh.paidAt ?? new Date().toISOString(),
    hdUrl,
    hdPending: false,
  });

  const sent = await sendCleanMovieEmail({
    to: state.email,
    jobId,
    prompt: state.prompt,
    cleanUrl: hdUrl,
    bypass: opts.bypass,
  });
  console.log(
    "[chappieworks:movie] deliverMovieHd email",
    jobId,
    sent.ok ? `sent id=${"id" in sent ? sent.id : ""}` : `FAILED ${sent.error}`,
  );
}
