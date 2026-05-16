import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
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
  console.log("[chappieworks:watermark] workdir", workDir, "ffmpegPath", ffmpegPath);
  try {
    await writeFile(inPath, cleanMp4);
    console.log("[chappieworks:watermark] wrote input file", inPath);

    // Two-layer watermark: large diagonal "CHAPPIE WORKS PREVIEW" text +
    // smaller bottom-strip URL. Both are burned into the pixels so the
    // overlay survives download / inspect-element.
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
      console.log("[chappieworks:watermark] starting ffmpeg encoding");
      const timeout = setTimeout(() => {
        console.error("[chappieworks:watermark] timeout after 120s");
        reject(new Error("watermark encoding timeout (120s)"));
      }, 120000);
      ffmpeg(inPath)
        .videoFilters([drawtext1, drawtext2])
        .outputOptions(["-c:a copy", "-preset veryfast", "-crf 23"])
        .on("start", (cmd) => {
          console.log("[chappieworks:watermark] ffmpeg started", cmd);
        })
        .on("progress", (prog) => {
          console.log("[chappieworks:watermark] progress", prog);
        })
        .on("end", async () => {
          console.log("[chappieworks:watermark] ffmpeg completed");
          clearTimeout(timeout);
          try {
            const data = await readFile(outPath);
            console.log("[chappieworks:watermark] read output", data.length, "bytes");
            resolve(data);
          } catch (err) {
            console.error("[chappieworks:watermark] failed to read output", err);
            reject(err);
          }
        })
        .on("error", (err) => {
          console.error("[chappieworks:watermark] ffmpeg error", err);
          clearTimeout(timeout);
          reject(err);
        })
        .save(outPath);
    });
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
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
      const failed: MovieState = {
        ...state,
        status: "failed",
        failureReason:
          prediction.error?.toString() ?? `replicate ${prediction.status}`,
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

      // Mark watermarking so concurrent polls don't double-process
      await writeState({ ...state, status: "watermarking" });

      console.log("[chappieworks:movie] downloading video", jobId, url);
      const cleanBuffer = await downloadToBuffer(url);
      console.log("[chappieworks:movie] video downloaded", jobId, cleanBuffer.length, "bytes");

      console.log("[chappieworks:movie] uploading to blob storage");
      const cleanBlob = await put(CLEAN_KEY(jobId), cleanBuffer, {
        access: "public",
        contentType: "video/mp4",
        addRandomSuffix: false,
        allowOverwrite: true,
      });

      console.log(
        "[chappieworks:movie] blob uploaded",
        jobId,
        "url",
        cleanBlob.url,
      );

      const ready: MovieState = {
        ...state,
        status: "ready",
        previewUrl: cleanBlob.url,
        cleanUrl: cleanBlob.url,
        durationSec: 5,
      };
      await writeState(ready);
      console.log(
        "[chappieworks:movie] job ready",
        jobId,
        "url",
        cleanBlob.url,
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
  };
}
