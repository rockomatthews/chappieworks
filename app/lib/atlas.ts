// Atlas Cloud client — the uncensored video backend for the "Raw" tier.
//
// Unlike fal.ai (which applies platform-wide content moderation on every model,
// blocking cinematic violence), Atlas Cloud does not moderate prompts. We still
// block sexual/adult prompts ourselves before submitting (see lib/moderation),
// so Raw = violence allowed, NSFW blocked, Stripe/brand safe.
//
// API shape (https://api.atlascloud.ai/api/v1):
//   submit: POST /model/generateVideo  { model, prompt, ... } -> { data: { task_id } }
//   poll:   GET  /model/prediction/{task_id} -> { data: { task_status, task_result } }
// Auth: Authorization: Bearer <ATLAS_API_KEY>.

const ATLAS_BASE = "https://api.atlascloud.ai/api/v1";

// The truly-uncensored ("spicy") models are image-to-video only; the regular Wan
// text-to-video on Atlas is unmoderated for violence (Atlas applies no platform
// content filter). Both slugs are overridable via env so we can swap without a
// deploy. Verified model ids from Atlas's live /models catalogue.
export const ATLAS_TEXT_TO_VIDEO =
  process.env.ATLAS_TEXT_MODEL ?? "alibaba/wan-2.5/text-to-video";
export const ATLAS_IMAGE_TO_VIDEO =
  process.env.ATLAS_IMAGE_MODEL ??
  "atlascloud/wan-2.2-turbo-spicy/image-to-video";

function atlasKey(): string {
  const key = process.env.ATLAS_API_KEY;
  if (!key) throw new Error("ATLAS_API_KEY not set");
  return key;
}

export async function atlasSubmit(
  model: string,
  input: Record<string, unknown>,
): Promise<{ taskId: string }> {
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
  let d: {
    data?: { task_id?: string; taskId?: string; id?: string };
    task_id?: string;
  } = {};
  try {
    d = JSON.parse(text);
  } catch {
    throw new Error(`atlas submit: non-JSON response ${text.slice(0, 200)}`);
  }
  const taskId =
    d.data?.task_id ?? d.data?.taskId ?? d.data?.id ?? d.task_id ?? null;
  if (!taskId) {
    throw new Error(`atlas submit: no task_id in ${text.slice(0, 200)}`);
  }
  return { taskId };
}

export type AtlasResult = {
  status: "pending" | "completed" | "failed";
  videoUrl: string | null;
  error?: string;
};

// Defensive across the two documented result shapes:
//   { data: { task_status, task_result: { videos: [{ url }] } } }
//   { data: { status, outputs: [url | { url }] } }
export async function atlasPoll(taskId: string): Promise<AtlasResult> {
  const res = await fetch(`${ATLAS_BASE}/model/prediction/${taskId}`, {
    headers: { Authorization: `Bearer ${atlasKey()}` },
    cache: "no-store",
  });
  const text = await res.text();
  // Transient non-200s: treat as still-pending rather than hard-failing the job.
  if (!res.ok) return { status: "pending", videoUrl: null };

  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(text);
  } catch {
    return { status: "pending", videoUrl: null };
  }
  const data = (parsed.data ?? parsed) as Record<string, unknown>;

  const statusRaw = String(
    (data.task_status ?? data.status ?? "") as string,
  ).toLowerCase();

  // Find the video URL across the possible shapes.
  const taskResult = data.task_result as
    | { videos?: Array<{ url?: string }> }
    | undefined;
  const outputs = data.outputs as
    | Array<string | { url?: string }>
    | undefined;
  let url: string | null =
    taskResult?.videos?.[0]?.url ??
    (typeof outputs?.[0] === "string"
      ? (outputs[0] as string)
      : (outputs?.[0] as { url?: string } | undefined)?.url) ??
    (data.output as string | undefined) ??
    null;
  if (typeof url !== "string") url = null;

  const isDone =
    statusRaw.includes("complet") ||
    statusRaw.includes("succe") ||
    statusRaw === "done";
  const isFail =
    statusRaw.includes("fail") ||
    statusRaw.includes("error") ||
    statusRaw.includes("cancel");

  if (isFail) {
    const msg =
      (data.message as string) ?? (data.error as string) ?? "atlas render failed";
    return { status: "failed", videoUrl: null, error: msg };
  }
  if (isDone || url) {
    if (!url) return { status: "failed", videoUrl: null, error: "atlas: completed with no video url" };
    return { status: "completed", videoUrl: url };
  }
  return { status: "pending", videoUrl: null };
}
