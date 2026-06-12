// Minimal fal.ai queue client — runs Kling (and any fal model) via the REST
// queue API. Dependency-free (fetch only) to keep the public-repo supply chain
// tight. Reads FAL_KEY server-side; never exposed to the client.

const FAL_BASE = "https://queue.fal.run";

export const KLING_TEXT_TO_VIDEO =
  "fal-ai/kling-video/v2.1/master/text-to-video";
export const KLING_IMAGE_TO_VIDEO =
  "fal-ai/kling-video/v2.1/master/image-to-video";

// Standard tier — Veo 3.1 (Google) via fal. Native audio: dialogue + SFX +
// ambient, with lip-sync. Durations are 4s/6s/8s only. Output shape matches
// Kling ({video:{url}}). Default to the FAST tier: $0.15/s with audio vs $0.40/s
// on Standard (~62% cheaper), still native 1080p. Set FAL_STD_TEXT_MODEL to
// "fal-ai/veo3.1" for max-quality Standard, or back to Kling, without a deploy.
export const VEO_TEXT_TO_VIDEO =
  process.env.FAL_STD_TEXT_MODEL ?? "fal-ai/veo3.1/fast";
// No documented fast image-to-video variant, so i2v stays on Standard (rarer path).
export const VEO_IMAGE_TO_VIDEO =
  process.env.FAL_STD_IMAGE_MODEL ?? "fal-ai/veo3.1/image-to-video";

// "Raw" tier — Wan 2.2 (open model, far fewer content restrictions than the
// hosted commercial models). Slugs overridable via env if we swap models.
export const WAN_TEXT_TO_VIDEO =
  process.env.FAL_RAW_TEXT_MODEL ?? "fal-ai/wan/v2.2-a14b/text-to-video";
export const WAN_IMAGE_TO_VIDEO =
  process.env.FAL_RAW_IMAGE_MODEL ?? "fal-ai/wan/v2.2-a14b/image-to-video";

function falKey(): string {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("FAL_KEY not set");
  return key;
}

export type FalSubmit = {
  requestId: string;
  statusUrl: string;
  resultUrl: string;
};

// Submit a job to fal's queue. Returns the request id + the status/result URLs
// fal hands back (we persist these so a later poll can resolve the job).
export async function falSubmit(
  model: string,
  input: Record<string, unknown>,
): Promise<FalSubmit> {
  const res = await fetch(`${FAL_BASE}/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${falKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`fal submit ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const d = (await res.json()) as {
    request_id: string;
    status_url?: string;
    response_url?: string;
  };
  return {
    requestId: d.request_id,
    statusUrl:
      d.status_url ?? `${FAL_BASE}/${model}/requests/${d.request_id}/status`,
    resultUrl:
      d.response_url ?? `${FAL_BASE}/${model}/requests/${d.request_id}`,
  };
}

export type FalStatus = "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "ERROR";

export async function falStatus(statusUrl: string): Promise<FalStatus> {
  const res = await fetch(statusUrl, {
    headers: { Authorization: `Key ${falKey()}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`fal status ${res.status}`);
  }
  const d = (await res.json()) as { status?: string };
  return (d.status as FalStatus) ?? "IN_PROGRESS";
}

// Fetch the finished result. Returns the video URL on success, or a structured
// error ("policy" for content-policy flags, else a message) so callers can show
// a real reason instead of a generic failure.
export async function falVideoResult(
  resultUrl: string,
): Promise<{ videoUrl: string | null; error?: string }> {
  const res = await fetch(resultUrl, {
    headers: { Authorization: `Key ${falKey()}` },
    cache: "no-store",
  });
  const text = await res.text();
  let d: {
    video?: { url?: string } | Array<{ url?: string }>;
    video_url?: string;
    detail?: unknown;
  } = {};
  try {
    d = JSON.parse(text);
  } catch {
    /* non-JSON */
  }

  if (!res.ok) {
    const detail = d.detail;
    const items = Array.isArray(detail) ? (detail as Array<{ msg?: string; type?: string }>) : [];
    const isPolicy =
      items.some((x) => x.type === "content_policy_violation") ||
      /content.?polic|content checker|flagged/i.test(text);
    if (isPolicy) return { videoUrl: null, error: "policy" };
    const msg = items.map((x) => x.msg).filter(Boolean).join("; ");
    return { videoUrl: null, error: msg || `fal result ${res.status}` };
  }

  const video = d.video;
  const url =
    (Array.isArray(video) ? video[0]?.url : video?.url) ?? d.video_url ?? null;
  return { videoUrl: url };
}
