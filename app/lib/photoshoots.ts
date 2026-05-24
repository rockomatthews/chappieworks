import { put, list } from "@vercel/blob";
import type { ImageMode } from "./photoshootGen";

export type PhotoshootImage = {
  mode: ImageMode;
  modeLabel: string;
  size: string;
  url: string;
};

export type PhotoshootState = {
  jobId: string;
  createdAt: string;
  email?: string;
  name?: string;
  brand_name?: string;
  brand_description?: string;
  industry?: string;
  vibe?: string;
  color_palette?: string;
  reference_url?: string;
  status: "pending" | "generating" | "ready" | "failed";
  images: PhotoshootImage[];
  failureReason?: string;
};

const STATE_KEY = (jobId: string) => `photoshoots/${jobId}/state.json`;
const IMAGE_KEY = (jobId: string, mode: ImageMode) =>
  `photoshoots/${jobId}/${mode}.png`;

export { STATE_KEY, IMAGE_KEY };

export function newJobId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function writeState(state: PhotoshootState): Promise<void> {
  await put(STATE_KEY(state.jobId), JSON.stringify(state, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function readState(jobId: string): Promise<PhotoshootState | null> {
  const { blobs } = await list({ prefix: STATE_KEY(jobId) });
  const blob = blobs.find((b) => b.pathname === STATE_KEY(jobId));
  if (!blob) return null;
  const res = await fetch(blob.url, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as PhotoshootState;
}

export async function uploadImage(
  jobId: string,
  mode: ImageMode,
  base64Png: string,
): Promise<string> {
  const buf = Buffer.from(base64Png, "base64");
  const blob = await put(IMAGE_KEY(jobId, mode), buf, {
    access: "public",
    contentType: "image/png",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return blob.url;
}
