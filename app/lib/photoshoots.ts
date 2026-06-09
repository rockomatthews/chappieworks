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
  // Brand assets the customer uploaded — their real logo + photos. Used as
  // reference images so the output looks like THEM, not generic stock.
  logoUrl?: string;
  assetUrls?: string[];
  // Brand DNA read off the uploaded assets (Claude vision).
  paletteHex?: string[];
  styleNotes?: string;
  // Brand identity document fields (paid package).
  fontPairing?: { heading: string; body: string; rationale?: string };
  voiceNotes?: string;
  // Free preview state.
  status: "pending" | "generating" | "ready" | "failed";
  images: PhotoshootImage[];
  failureReason?: string;
  // Paid full-brand-identity-package state.
  paid?: boolean;
  paidAt?: string;
  stripeSessionId?: string;
  packageStatus?: "idle" | "generating" | "ready" | "failed";
  packageImages?: PhotoshootImage[];
  packageFailureReason?: string;
};

const STATE_KEY = (jobId: string) => `photoshoots/${jobId}/state.json`;
const IMAGE_KEY = (jobId: string, mode: ImageMode) =>
  `photoshoots/${jobId}/${mode}.png`;
const ASSET_KEY = (jobId: string, idx: number, ext: string) =>
  `photoshoots/${jobId}/asset-${idx}.${ext}`;

export { STATE_KEY, IMAGE_KEY, ASSET_KEY };

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
  const key = STATE_KEY(jobId);
  // Vercel Blob `list` is eventually consistent — retry briefly so a freshly
  // created job doesn't 404 on its first status poll.
  for (let attempt = 0; attempt < 4; attempt++) {
    const { blobs } = await list({ prefix: key });
    const blob = blobs.find((b) => b.pathname === key);
    if (blob) {
      const res = await fetch(blob.url, { cache: "no-store" });
      if (!res.ok) return null;
      return (await res.json()) as PhotoshootState;
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, 600));
  }
  return null;
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

// Upload a customer-supplied brand asset (logo / photo) and return its URL.
export async function uploadAsset(
  jobId: string,
  idx: number,
  buf: Buffer,
  contentType: string,
): Promise<string> {
  const ext = contentType.includes("png")
    ? "png"
    : contentType.includes("webp")
      ? "webp"
      : "jpg";
  const blob = await put(ASSET_KEY(jobId, idx, ext), buf, {
    access: "public",
    contentType,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return blob.url;
}
