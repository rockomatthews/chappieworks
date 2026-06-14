import { put, list, del } from "@vercel/blob";

export type MovieMode = "text" | "image" | "video";

export type MovieState = {
  jobId: string;
  prompt: string;
  email: string;
  createdAt: string;
  replicateId?: string;        // legacy Seedance jobs
  openaiVideoId?: string;      // legacy Sora 2 jobs
  falRequestId?: string;       // legacy Kling/Veo/Wan (via fal.ai) jobs
  falStatusUrl?: string;
  falResultUrl?: string;
  atlasTaskId?: string;        // Atlas Cloud jobs (current — uncensored backend)
  status: "pending" | "generating" | "watermarking" | "ready" | "failed";
  failureReason?: string;
  previewUrl?: string;
  cleanUrl?: string;
  // The 1080p deliverable, produced from cleanUrl at purchase time (AI upscale
  // with an ffmpeg "boost" fallback). Falls back to cleanUrl if not ready yet.
  hdUrl?: string;
  hdPending?: boolean;
  durationSec?: number;
  paid: boolean;
  paidAt?: string;
  stripeSessionId?: string;
  // Generation inputs — what the user supplied.
  mode?: MovieMode;
  // For image-to-video and as the seed frame for extension mode (last frame).
  startImageUrl?: string;
  // The user's uploaded video when extending. We stitch this in front of the
  // new clip for the preview, but only deliver the new clip on purchase.
  inputVideoUrl?: string;
};

const STATE_KEY = (jobId: string) => `movies/${jobId}/state.json`;
const PREVIEW_KEY = (jobId: string) => `movies/${jobId}/preview.mp4`;
const CLEAN_KEY = (jobId: string) => `movies/${jobId}/clean.mp4`;
const HD_KEY = (jobId: string) => `movies/${jobId}/hd.mp4`;

export { STATE_KEY, PREVIEW_KEY, CLEAN_KEY, HD_KEY };

export function newJobId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function writeState(state: MovieState): Promise<void> {
  await put(STATE_KEY(state.jobId), JSON.stringify(state, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function readState(jobId: string): Promise<MovieState | null> {
  const key = STATE_KEY(jobId);
  // Vercel Blob `list` is eventually consistent — a just-written state can be
  // absent for a second or two. Retry briefly so freshly created jobs don't 404
  // on their first status polls.
  for (let attempt = 0; attempt < 4; attempt++) {
    const { blobs } = await list({ prefix: key });
    const blob = blobs.find((b) => b.pathname === key);
    if (blob) {
      // Cache-bust the blob CDN: its public URL edge-caches stale content for
      // ~a minute after an overwrite, which made read-modify-write clobber and
      // fast post-render reads (e.g. checkout right after a preview finishes)
      // see stale state. A unique query is a distinct CDN key → always fresh.
      const res = await fetch(`${blob.url}?v=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) return null;
      return (await res.json()) as MovieState;
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, 600));
  }
  return null;
}

export async function deleteJobAssets(jobId: string): Promise<void> {
  const { blobs } = await list({ prefix: `movies/${jobId}/` });
  await Promise.all(blobs.map((b) => del(b.url)));
}
