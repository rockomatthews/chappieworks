import {
  extractBrandDna,
  craftPrompts,
  generateImage,
  MODE_SPECS,
  FREE_MODES,
  PACKAGE_MODES,
} from "./photoshootGen";
import {
  readState,
  writeState,
  uploadImage,
  type PhotoshootImage,
  type PhotoshootState,
} from "./photoshoots";

function refsOf(state: { logoUrl?: string; assetUrls?: string[] }): string[] {
  return [state.logoUrl, ...(state.assetUrls ?? [])].filter(Boolean) as string[];
}

// NOTE: we accumulate the state in memory and write the full object on each
// step rather than read-modify-writing. Vercel Blob reads are eventually
// consistent, so a mid-run re-read can return a stale copy and silently clobber
// fields written moments earlier (e.g. the brand palette). Nothing else writes
// to this job while a run is in flight, so the in-memory copy is authoritative.

// Free preview — 3 alluring on-brand visuals, generated FROM the customer's
// uploaded assets (logo/photos as references) so they look like the brand.
export async function runFreePreview(jobId: string): Promise<void> {
  const initial = await readState(jobId);
  if (!initial) return;
  let cur: PhotoshootState = { ...initial, status: "generating" };
  await writeState(cur);

  try {
    const refs = refsOf(cur);

    if (refs.length && !cur.styleNotes) {
      const dna = await extractBrandDna(refs);
      cur = { ...cur, paletteHex: dna.paletteHex, styleNotes: dna.styleNotes };
      await writeState(cur);
    }

    const prompts = await craftPrompts(cur, FREE_MODES);
    const images: PhotoshootImage[] = [];
    for (const mode of FREE_MODES) {
      const spec = MODE_SPECS[mode];
      const b64 = await generateImage(
        prompts[mode],
        spec.size,
        refs.length ? refs : undefined,
      );
      const url = await uploadImage(jobId, mode, b64);
      images.push({ mode, modeLabel: spec.label, size: spec.size, url });
      cur = { ...cur, images: [...images] };
      await writeState(cur);
    }
    cur = { ...cur, status: "ready", images };
    await writeState(cur);
    console.log("[chappieworks:photoshoot] preview ready", jobId, images.length);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[chappieworks:photoshoot] preview failed", jobId, message);
    await writeState({ ...cur, status: "failed", failureReason: message });
  }
}

// Paid full brand identity package — runs after Stripe payment.
export async function runPackage(jobId: string): Promise<void> {
  const initial = await readState(jobId);
  if (!initial) return;
  if (initial.packageStatus === "ready") return;
  let cur: PhotoshootState = { ...initial, packageStatus: "generating" };
  await writeState(cur);

  try {
    const refs = refsOf(cur);
    const prompts = await craftPrompts(cur, PACKAGE_MODES);
    const images: PhotoshootImage[] = [];
    for (const mode of PACKAGE_MODES) {
      const spec = MODE_SPECS[mode];
      const b64 = await generateImage(
        prompts[mode],
        spec.size,
        refs.length ? refs : undefined,
      );
      const url = await uploadImage(jobId, mode, b64);
      images.push({ mode, modeLabel: spec.label, size: spec.size, url });
      cur = { ...cur, packageImages: [...images] };
      await writeState(cur);
    }
    cur = { ...cur, packageStatus: "ready", packageImages: images };
    await writeState(cur);
    console.log("[chappieworks:photoshoot] package ready", jobId, images.length);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[chappieworks:photoshoot] package failed", jobId, message);
    await writeState({
      ...cur,
      packageStatus: "failed",
      packageFailureReason: message,
    });
  }
}
