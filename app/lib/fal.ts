// Minimal fal.ai queue client — runs Kling (and any fal model) via the REST
// queue API. Dependency-free (fetch only) to keep the public-repo supply chain
// tight. Reads FAL_KEY server-side; never exposed to the client.

const FAL_BASE = "https://queue.fal.run";

export const KLING_TEXT_TO_VIDEO =
  "fal-ai/kling-video/v2.1/master/text-to-video";
export const KLING_IMAGE_TO_VIDEO =
  "fal-ai/kling-video/v2.1/master/image-to-video";

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

// Fetch the finished result and pull out the video URL.
export async function falVideoResult(resultUrl: string): Promise<string | null> {
  const res = await fetch(resultUrl, {
    headers: { Authorization: `Key ${falKey()}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`fal result ${res.status}`);
  }
  const d = (await res.json()) as { video?: { url?: string } };
  return d.video?.url ?? null;
}
