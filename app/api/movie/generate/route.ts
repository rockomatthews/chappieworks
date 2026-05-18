import { NextResponse } from "next/server";
import Replicate from "replicate";
import { put } from "@vercel/blob";
import {
  newJobId,
  writeState,
  type MovieState,
} from "../../../lib/movies";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const MAX_PROMPT_LEN = 800;
const MIN_PROMPT_LEN = 10;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB cap on uploaded reference image
const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

// Kling 2.6 on Replicate — text-to-video AND image-to-video in one model,
// native audio generation, Western-agnostic training. ~$0.50–$1.00 per 5s clip.
const MODEL = "kwaivgi/kling-v2.6" as `${string}/${string}`;

export async function POST(req: Request) {
  // Accept either multipart/form-data (with optional reference image) or JSON.
  const contentType = req.headers.get("content-type") ?? "";
  let prompt = "";
  let email = "";
  let imageFile: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    prompt = String(form.get("prompt") ?? "").trim();
    email = String(form.get("email") ?? "").trim().toLowerCase();
    const maybeImage = form.get("image");
    if (maybeImage instanceof File && maybeImage.size > 0) {
      imageFile = maybeImage;
    }
  } else {
    try {
      const body = (await req.json()) as {
        prompt?: string;
        email?: string;
      };
      prompt = (body.prompt ?? "").trim();
      email = (body.email ?? "").trim().toLowerCase();
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

  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    console.error("[chappieworks:movie] REPLICATE_API_TOKEN missing");
    return NextResponse.json(
      { error: "generator offline — try again shortly" },
      { status: 503 },
    );
  }

  const replicate = new Replicate({ auth: apiToken });
  const jobId = newJobId();

  // Upload the optional reference image to Vercel Blob and use the public URL
  // as the start frame for Kling 2.6's image-to-video mode.
  let startImageUrl: string | undefined;
  if (imageFile) {
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

  try {
    const input: Record<string, unknown> = {
      prompt,
      duration: 5,
      aspect_ratio: "16:9",
      audio: true,
    };
    if (startImageUrl) {
      input.start_image = startImageUrl;
    }

    const prediction = await replicate.predictions.create({
      model: MODEL,
      input,
    });

    const state: MovieState = {
      jobId,
      prompt,
      email,
      createdAt: new Date().toISOString(),
      replicateId: prediction.id,
      status: "generating",
      paid: false,
    };
    await writeState(state);

    console.log(
      "[chappieworks:movie] created job",
      jobId,
      "replicate",
      prediction.id,
      "mode",
      startImageUrl ? "image-to-video" : "text-to-video",
    );

    return NextResponse.json({ jobId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[chappieworks:movie] create prediction failed", message);
    return NextResponse.json(
      { error: `couldn't start generation: ${message}` },
      { status: 502 },
    );
  }
}
