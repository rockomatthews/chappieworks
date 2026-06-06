import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import OpenAI from "openai";
import Replicate from "replicate";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import { mkdtemp, rm, readFile, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import {
  readState,
  writeState,
  PREVIEW_KEY,
  CLEAN_KEY,
  type MovieState,
} from "../../../../lib/movies";
import { falStatus, falVideoResult, type FalStatus } from "../../../../lib/fal";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

async function downloadToBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

async function burnWatermark(cleanMp4: Buffer): Promise<Buffer> {
  const workDir = await mkdtemp(path.join(tmpdir(), "movie-"));
  const inPath = path.join(workDir, "in.mp4");
  const outPath = path.join(workDir, "out.mp4");
  console.log(
    "[chappieworks:watermark] workdir",
    workDir,
    "ffmpegPath",
    ffmpegPath,
  );
  try {
    await writeFile(inPath, cleanMp4);

    const drawtext1 =
      "drawtext=text='CHAPPIE WORKS PREVIEW':" +
      "fontcolor=white@0.55:fontsize=72:" +
      "x=(w-text_w)/2:y=(h-text_h)/2:" +
      "box=1:boxcolor=black@0.35:boxborderw=24";
    const drawtext2 =
      "drawtext=text='chappieworks.com/movie · buy to remove':" +
      "fontcolor=white@0.85:fontsize=28:" +
      "x=(w-text_w)/2:y=h-th-30:" +
      "box=1:boxcolor=black@0.5:boxborderw=14";

    return await new Promise<Buffer>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("watermark encoding timeout (120s)"));
      }, 120000);
      ffmpeg(inPath)
        .videoFilters([drawtext1, drawtext2])
        .outputOptions(["-c:a copy", "-preset veryfast", "-crf 23"])
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

async function pollFal(state: MovieState): Promise<NextResponse> {
  if (!state.falStatusUrl || !state.falResultUrl) {
    return NextResponse.json(publicView(state));
  }

  let status: FalStatus;
  try {
    status = await falStatus(state.falStatusUrl);
  } catch (err) {
    console.error(
      "[chappieworks:movie] fal status failed",
      state.jobId,
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json(publicView(state));
  }

  if (status === "IN_QUEUE" || status === "IN_PROGRESS") {
    // Hard cap so a stalled render can't hang in "generating" forever.
    const ageMs = Date.now() - new Date(state.createdAt).getTime();
    if (ageMs > 15 * 60 * 1000) {
      const failed: MovieState = {
        ...state,
        status: "failed",
        failureReason:
          "The render took too long and timed out. No charge — please try again, it's usually quick.",
      };
      await writeState(failed);
      return NextResponse.json(publicView(failed));
    }
    if (state.status !== "generating") {
      await writeState({ ...state, status: "generating" });
    }
    return NextResponse.json({ ...publicView(state), status: "generating" });
  }

  // COMPLETED or ERROR — resolve the result (or surface the real reason).
  await writeState({ ...state, status: "watermarking" });

  let videoUrl: string | null = null;
  let resultError: string | undefined;
  try {
    const r = await falVideoResult(state.falResultUrl);
    videoUrl = r.videoUrl;
    resultError = r.error;
  } catch (err) {
    resultError = err instanceof Error ? err.message : "unknown";
  }

  if (!videoUrl) {
    const friendly =
      resultError === "policy"
        ? "Flagged by the content checker. Note: fal.ai moderates violent/graphic prompts on every model, including the Raw tier. Rephrase and try again."
        : resultError ?? "couldn't download generated video";
    console.error("[chappieworks:movie] fal job failed", state.jobId, friendly);
    const failed: MovieState = {
      ...state,
      status: "failed",
      failureReason: friendly,
    };
    await writeState(failed);
    return NextResponse.json(publicView(failed));
  }

  let cleanBuffer: Buffer;
  try {
    cleanBuffer = await downloadToBuffer(videoUrl);
  } catch (err) {
    console.error(
      "[chappieworks:movie] fal download failed",
      state.jobId,
      err instanceof Error ? err.message : err,
    );
    const failed: MovieState = {
      ...state,
      status: "failed",
      failureReason: "couldn't download generated video",
    };
    await writeState(failed);
    return NextResponse.json(publicView(failed));
  }
  return await finalizeReady(state, cleanBuffer);
}

async function pollSora(state: MovieState): Promise<NextResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !state.openaiVideoId) {
    return NextResponse.json(publicView(state));
  }
  const openai = new OpenAI({ apiKey });

  let video: OpenAI.Videos.Video;
  try {
    video = await openai.videos.retrieve(state.openaiVideoId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error(
      "[chappieworks:movie] sora retrieve failed",
      state.jobId,
      message,
    );
    return NextResponse.json(publicView(state));
  }

  if (video.status === "queued" || video.status === "in_progress") {
    // Hard cap: if Sora has been rendering far too long, fail gracefully so the
    // job can't hang in "generating" forever (orphaned when polling stops).
    const ageMs = Date.now() - new Date(state.createdAt).getTime();
    if (ageMs > 15 * 60 * 1000) {
      const failed: MovieState = {
        ...state,
        status: "failed",
        failureReason:
          "The render took too long and timed out (Sora's queue was backed up). No charge — please try again, it's usually quick.",
      };
      await writeState(failed);
      return NextResponse.json(publicView(failed));
    }
    const newStatus: MovieState["status"] = "generating";
    if (state.status !== newStatus) {
      await writeState({ ...state, status: newStatus });
    }
    return NextResponse.json({ ...publicView(state), status: newStatus });
  }

  if (video.status === "failed") {
    const raw = video.error?.message ?? "sora generation failed";
    const code = video.error?.code ?? "";
    const isPolicy =
      /policy|moderation|safety|content/i.test(raw) || /policy/i.test(code);
    const friendly = isPolicy
      ? "Sora flagged this prompt under its content policy (real public figures, branded IP, graphic content, etc.). Rephrase and try again."
      : raw;
    const failed: MovieState = {
      ...state,
      status: "failed",
      failureReason: friendly,
    };
    await writeState(failed);
    return NextResponse.json(publicView(failed));
  }

  if (video.status === "completed") {
    await writeState({ ...state, status: "watermarking" });
    console.log(
      "[chappieworks:movie] downloading sora video",
      state.jobId,
      video.id,
    );
    let cleanBuffer: Buffer;
    try {
      const res = await openai.videos.downloadContent(video.id, {
        variant: "video",
      });
      const ab = await res.arrayBuffer();
      cleanBuffer = Buffer.from(ab);
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown";
      console.error(
        "[chappieworks:movie] sora download failed",
        state.jobId,
        message,
      );
      const failed: MovieState = {
        ...state,
        status: "failed",
        failureReason: "couldn't download generated video",
      };
      await writeState(failed);
      return NextResponse.json(publicView(failed));
    }

    return await finalizeReady(state, cleanBuffer);
  }

  return NextResponse.json(publicView(state));
}

async function finalizeReady(
  state: MovieState,
  cleanBuffer: Buffer,
): Promise<NextResponse> {
  const jobId = state.jobId;
  // Store the native 720p as the preview-quality clip. The 1080p deliverable is
  // produced from this at purchase time (see lib/movieUpscale).
  const cleanBlob = await put(CLEAN_KEY(jobId), cleanBuffer, {
    access: "public",
    contentType: "video/mp4",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  let previewUrl = cleanBlob.url;
  if (state.mode === "video") {
    try {
      const watermarked = await burnWatermark(cleanBuffer);
      const previewBlob = await put(PREVIEW_KEY(jobId), watermarked, {
        access: "public",
        contentType: "video/mp4",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      previewUrl = previewBlob.url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown";
      console.error(
        "[chappieworks:watermark] burn failed, falling back to clean",
        jobId,
        message,
      );
    }
  }

  const ready: MovieState = {
    ...state,
    status: "ready",
    previewUrl,
    cleanUrl: cleanBlob.url,
    durationSec: state.durationSec ?? 4,
  };
  await writeState(ready);
  console.log(
    "[chappieworks:movie] job ready",
    jobId,
    "mode",
    state.mode ?? "text",
    "duration",
    ready.durationSec,
  );
  return NextResponse.json(publicView(ready));
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await ctx.params;
  const state = await readState(jobId);
  if (!state) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (state.status === "ready" || state.status === "failed") {
    return NextResponse.json(publicView(state));
  }

  // Kling (fal.ai) path — current
  if (state.falRequestId) {
    try {
      return await pollFal(state);
    } catch (err) {
      console.error(
        "[chappieworks:movie] fal poll threw",
        jobId,
        err instanceof Error ? err.message : err,
      );
      return NextResponse.json(publicView(state));
    }
  }

  // Sora 2 path (legacy jobs)
  if (state.openaiVideoId) {
    try {
      return await pollSora(state);
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown";
      console.error(
        "[chappieworks:movie] sora poll threw",
        jobId,
        message,
      );
      return NextResponse.json(publicView(state));
    }
  }

  // Legacy Replicate path (existing jobs created before Sora migration)
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken || !state.replicateId) {
    return NextResponse.json(publicView(state));
  }

  const replicate = new Replicate({ auth: apiToken });
  try {
    const prediction = await replicate.predictions.get(state.replicateId);

    if (prediction.status === "starting" || prediction.status === "processing") {
      const newStatus: MovieState["status"] = "generating";
      if (state.status !== newStatus) {
        await writeState({ ...state, status: newStatus });
      }
      return NextResponse.json({
        ...publicView(state),
        status: newStatus,
      });
    }

    if (prediction.status === "failed" || prediction.status === "canceled") {
      const rawError =
        prediction.error?.toString() ?? `replicate ${prediction.status}`;
      const isSensitive =
        /E005|flagged as sensitive|content[\s_-]*polic/i.test(rawError);
      const friendly = isSensitive
        ? "Seedance flagged this prompt as sensitive (real public figures, branded IP, violence, or suggestive content trigger it). Rephrase and try again."
        : rawError;
      const failed: MovieState = {
        ...state,
        status: "failed",
        failureReason: friendly,
      };
      await writeState(failed);
      return NextResponse.json(publicView(failed));
    }

    if (prediction.status === "succeeded") {
      const output = prediction.output;
      const url =
        typeof output === "string"
          ? output
          : Array.isArray(output) && typeof output[0] === "string"
            ? (output[0] as string)
            : null;
      if (!url) {
        const failed: MovieState = {
          ...state,
          status: "failed",
          failureReason: "replicate returned no video url",
        };
        await writeState(failed);
        return NextResponse.json(publicView(failed));
      }

      await writeState({ ...state, status: "watermarking" });

      console.log("[chappieworks:movie] downloading video", jobId, url);
      const cleanBuffer = await downloadToBuffer(url);

      const cleanBlob = await put(CLEAN_KEY(jobId), cleanBuffer, {
        access: "public",
        contentType: "video/mp4",
        addRandomSuffix: false,
        allowOverwrite: true,
      });

      // For extension mode (user uploaded a video to extend), burn a real
      // watermark on the new 10s so the preview clearly signals "buy to
      // unlock." Paid users get the bare clean clip. For text/image mode,
      // the client-side SVG overlay handles preview labeling.
      let previewUrl = cleanBlob.url;
      if (state.mode === "video") {
        try {
          const watermarked = await burnWatermark(cleanBuffer);
          const previewBlob = await put(PREVIEW_KEY(jobId), watermarked, {
            access: "public",
            contentType: "video/mp4",
            addRandomSuffix: false,
            allowOverwrite: true,
          });
          previewUrl = previewBlob.url;
        } catch (err) {
          const message = err instanceof Error ? err.message : "unknown";
          console.error(
            "[chappieworks:watermark] burn failed, falling back to clean",
            jobId,
            message,
          );
        }
      }

      const ready: MovieState = {
        ...state,
        status: "ready",
        previewUrl,
        cleanUrl: cleanBlob.url,
        durationSec: state.durationSec ?? 5,
      };
      await writeState(ready);
      console.log(
        "[chappieworks:movie] job ready",
        jobId,
        "mode",
        state.mode ?? "text",
        "duration",
        ready.durationSec,
      );
      return NextResponse.json(publicView(ready));
    }

    return NextResponse.json(publicView(state));
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    const stack = err instanceof Error ? err.stack : "";
    console.error(
      "[chappieworks:movie] status poll failed",
      jobId,
      message,
      stack,
    );
    return NextResponse.json(publicView(state));
  }
}

function publicView(state: MovieState) {
  return {
    jobId: state.jobId,
    status: state.status,
    paid: state.paid,
    previewUrl: state.previewUrl,
    cleanUrl: state.paid ? state.cleanUrl : undefined,
    failureReason: state.failureReason,
    prompt: state.prompt,
    mode: state.mode ?? "text",
    durationSec: state.durationSec,
    inputVideoUrl: state.inputVideoUrl,
  };
}
