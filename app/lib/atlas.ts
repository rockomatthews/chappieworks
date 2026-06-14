// Atlas Cloud video client — the uncensored backend for /movie. Atlas applies
// NO platform content moderation, so cinematic violence/gore/dark themes render
// (fal blocks those on every model, including Wan — which is why we left fal).
// We run our OWN adult-content screen (lib/moderation) before submitting, so
// NSFW stays out and Stripe/brand stay safe; violence is allowed.
//
// Dependency-free (fetch only) to keep the public-repo supply chain tight.
// Reads ATLAS_API_KEY server-side; never exposed to the client.

const ATLAS_BASE = "https://api.atlascloud.ai/api/v1";

// Wan 2.5 text-to-video (native audio, up to 1080p, uncensored). Wan 2.2 turbo
// "spicy" for image-to-video. Slugs overridable via env if Atlas changes them.
export const ATLAS_TEXT_MODEL =
  process.env.ATLAS_TEXT_MODEL ?? "alibaba/wan-2.5/text-to-video";
export const ATLAS_IMAGE_MODEL =
  process.env.ATLAS_IMAGE_MODEL ?? "atlascloud/wan-2.2-turbo-spicy/image-to-video";

function atlasKey(): string {
  const key = process.env.ATLAS_API_KEY;
  if (!key) throw new Error("ATLAS_API_KEY not set");
  return key;
}

export type AtlasSubmit = { taskId: string };

// Submit a generation job. Atlas returns the task id under `data.id` (some docs
// say `data.task_id` — accept either). We persist the id so a later poll can
// resolve the job.
export async function atlasSubmit(
  model: string,
  input: Record<string, unknown>,
): Promise<AtlasSubmit> {
  const res = await fetch(`${ATLAS_BASE}/model/generateVideo`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${atlasKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, ...input }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`atlas submit ${res.status}: ${text.slice(0, 300)}`);
  }
  let d: { data?: { id?: string; task_id?: string } } = {};
  try {
    d = JSON.parse(text);
  } catch {
    /* non-JSON */
  }
  const taskId = d.data?.id ?? d.data?.task_id;
  if (!taskId) {
    throw new Error(`atlas submit: no task id in response ${text.slice(0, 200)}`);
  }
  return { taskId };
}

export type AtlasStatus = "processing" | "completed" | "failed";

// Poll a job. Returns the normalized status plus the video URL once completed.
// Verified poll shape: `data.status` ("completed") + `data.outputs: [<mp4 url>]`.
// Also accepts the documented `data.task_result.videos[0].url` shape defensively.
export async function atlasPoll(
  taskId: string,
): Promise<{ status: AtlasStatus; videoUrl: string | null; error?: string }> {
  const res = await fetch(`${ATLAS_BASE}/model/prediction/${taskId}`, {
    headers: { Authorization: `Bearer ${atlasKey()}` },
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`atlas poll ${res.status}: ${text.slice(0, 200)}`);
  }
  let d: {
    data?: {
      status?: string;
      outputs?: unknown;
      error?: unknown;
      task_result?: { videos?: Array<{ url?: string }> };
    };
  } = {};
  try {
    d = JSON.parse(text);
  } catch {
    /* non-JSON */
  }

  const raw = (d.data?.status ?? "").toLowerCase();
  if (raw === "failed" || raw === "error" || raw === "canceled") {
    const errMsg =
      typeof d.data?.error === "string" ? d.data.error : "atlas generation failed";
    return { status: "failed", videoUrl: null, error: errMsg };
  }
  if (raw !== "completed" && raw !== "succeeded") {
    return { status: "processing", videoUrl: null };
  }

  // Completed — pull the URL. `outputs` is an array whose first item is either a
  // bare URL string or an object with a `url`.
  let url: string | null = null;
  const outputs = d.data?.outputs;
  if (Array.isArray(outputs) && outputs.length > 0) {
    const first = outputs[0];
    url =
      typeof first === "string"
        ? first
        : (first as { url?: string })?.url ?? null;
  }
  if (!url) {
    url = d.data?.task_result?.videos?.[0]?.url ?? null;
  }
  return { status: "completed", videoUrl: url };
}
