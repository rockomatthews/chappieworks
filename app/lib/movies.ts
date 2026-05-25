import { put, list, del } from "@vercel/blob";

export type MovieMode = "text" | "image" | "video";

export type MovieState = {
  jobId: string;
  prompt: string;
  email: string;
  createdAt: string;
  replicateId?: string;        // legacy Seedance jobs
  openaiVideoId?: string;      // Sora 2 jobs
  status: "pending" | "generating" | "watermarking" | "ready" | "failed";
  failureReason?: string;
  previewUrl?: string;
  cleanUrl?: string;
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

export { STATE_KEY, PREVIEW_KEY, CLEAN_KEY };

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
  const { blobs } = await list({ prefix: STATE_KEY(jobId) });
  const blob = blobs.find((b) => b.pathname === STATE_KEY(jobId));
  if (!blob) return null;
  const res = await fetch(blob.url, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as MovieState;
}

export async function deleteJobAssets(jobId: string): Promise<void> {
  const { blobs } = await list({ prefix: `movies/${jobId}/` });
  await Promise.all(blobs.map((b) => del(b.url)));
}
