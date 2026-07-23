import Replicate from "replicate";

// The "Raw" engine: Wan — an open video model with far fewer content
// restrictions than the hosted commercial models (cinematic violence renders).
// Hosted on REPLICATE, deliberately not:
//   - fal.ai   → moderates violence on every model incl. Wan (why we left)
//   - Atlas    → Sire: filtering, dropped
// Replicate is already wired into this app (token set in prod, legacy poll path
// in the status route), so Raw jobs reuse the existing replicateId lifecycle.

// Slug overridable via env so we can move Wan versions without a deploy.
export const WAN_MODEL =
  process.env.WAN_MODEL ?? "wan-video/wan-2.5-t2v";
export const WAN_IMAGE_MODEL =
  process.env.WAN_IMAGE_MODEL ?? "wan-video/wan-2.5-i2v";

export type WanSubmit = { predictionId: string };

// Submit a Wan render. Returns the Replicate prediction id — the status route's
// existing Replicate path polls it and finalizes (watermark + blobs) from there.
export async function wanSubmit(opts: {
  prompt: string;
  seconds: number; // 5 | 10
  startImageUrl?: string;
}): Promise<WanSubmit> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN not set");
  const replicate = new Replicate({ auth: token });

  const useImage = Boolean(opts.startImageUrl);
  const model = useImage ? WAN_IMAGE_MODEL : WAN_MODEL;

  const input: Record<string, unknown> = {
    prompt: opts.prompt,
    duration: opts.seconds,
    resolution: "1080p",
    aspect_ratio: "16:9",
  };
  if (useImage) input.image = opts.startImageUrl;

  // create() returns immediately with a prediction we poll ourselves, matching
  // the async job model the rest of /movie uses.
  const prediction = await replicate.predictions.create({
    model,
    input,
  });
  if (!prediction?.id) {
    throw new Error("wan: replicate returned no prediction id");
  }
  return { predictionId: prediction.id };
}
