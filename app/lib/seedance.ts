// Seedance 2.0 video client (seedance2.ai) — the /movie generation backend.
// Replaced Atlas Cloud (Sire: "their API is awesome"), staged for the 2.5 bump.
//
// Dependency-free (fetch only) to keep the public-repo supply chain tight.
// Reads SEEDANCE_API_KEY server-side (sk_live_… / sk_test_…); never exposed to
// the client. We still run our own adult-content screen (lib/moderation) before
// submitting, so NSFW stays out and Stripe/brand stay safe.

const SEEDANCE_BASE = "https://api.seedance2.ai";

// seedance-2-0 (full), -fast, or -mini. Override without a deploy via env.
export const SEEDANCE_MODEL = process.env.SEEDANCE_MODEL ?? "seedance-2-0";
// Docs example uses "720p"; seedance-2-0 supports 1080p. Overridable if a model
// rejects 1080p (e.g. the mini tier), no code change needed.
export const SEEDANCE_RESOLUTION = process.env.SEEDANCE_RESOLUTION ?? "1080p";

function seedanceKey(): string {
  const key = process.env.SEEDANCE_API_KEY;
  if (!key) throw new Error("SEEDANCE_API_KEY not set");
  return key;
}

export type SeedanceInput = {
  prompt: string;
  duration: number;        // seconds (5 or 10)
  aspectRatio?: string;    // "16:9"
  imageUrls?: string[];    // 1 = first frame, 2 = first+last (image-to-video)
};

export type SeedanceSubmit = { taskId: string };

// Submit a generation job. We poll (no callback_url). Response: { taskId, credits }.
export async function seedanceSubmit(
  input: SeedanceInput,
): Promise<SeedanceSubmit> {
  const hasImage = !!input.imageUrls && input.imageUrls.length > 0;
  const body = {
    model: SEEDANCE_MODEL,
    input: {
      prompt: input.prompt,
      generation_type: hasImage ? "image-to-video" : "text-to-video",
      duration: input.duration,
      aspect_ratio: input.aspectRatio ?? "16:9",
      resolution: SEEDANCE_RESOLUTION,
      generate_audio: true,
      watermark: false,
      ...(hasImage ? { image_urls: input.imageUrls } : {}),
    },
  };

  const res = await fetch(`${SEEDANCE_BASE}/v1/videos/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${seedanceKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`seedance submit ${res.status}: ${text.slice(0, 300)}`);
  }
  let d: { taskId?: string; task_id?: string; id?: string } = {};
  try {
    d = JSON.parse(text);
  } catch {
    /* non-JSON */
  }
  const taskId = d.taskId ?? d.task_id ?? d.id;
  if (!taskId) {
    throw new Error(`seedance submit: no task id in response ${text.slice(0, 200)}`);
  }
  return { taskId };
}

export type SeedanceStatus = "queued" | "generating" | "completed" | "failed";

// Poll a task. GET /v1/tasks/:id → { status, data: { results: [url] }, failed_reason }.
// Poll no more than once per 10s (enforced by the caller's status-route cadence).
export async function seedancePoll(
  taskId: string,
): Promise<{ status: SeedanceStatus; videoUrl: string | null; error?: string }> {
  const res = await fetch(`${SEEDANCE_BASE}/v1/tasks/${taskId}`, {
    headers: { Authorization: `Bearer ${seedanceKey()}` },
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`seedance poll ${res.status}: ${text.slice(0, 200)}`);
  }
  let d: {
    status?: string;
    failed_reason?: string | null;
    data?: { results?: unknown };
  } = {};
  try {
    d = JSON.parse(text);
  } catch {
    /* non-JSON */
  }

  const raw = (d.status ?? "").toLowerCase();
  if (raw === "failed" || raw === "error" || raw === "canceled") {
    return {
      status: "failed",
      videoUrl: null,
      error: d.failed_reason || "seedance generation failed",
    };
  }
  if (raw !== "completed") {
    return { status: raw === "queued" ? "queued" : "generating", videoUrl: null };
  }

  // Completed — the video URL is the first element of data.results.
  let url: string | null = null;
  const results = d.data?.results;
  if (Array.isArray(results) && results.length > 0) {
    const first = results[0];
    url =
      typeof first === "string"
        ? first
        : (first as { url?: string })?.url ?? null;
  }
  return { status: "completed", videoUrl: url };
}
