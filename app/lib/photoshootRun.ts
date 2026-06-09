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
} from "./photoshoots";

function refsOf(state: {
  logoUrl?: string;
  assetUrls?: string[];
}): string[] {
  return [state.logoUrl, ...(state.assetUrls ?? [])].filter(Boolean) as string[];
}

// Free preview — 3 alluring on-brand visuals, generated FROM the customer's
// uploaded assets (logo/photos as references) so they look like the brand.
export async function runFreePreview(jobId: string): Promise<void> {
  const state = await readState(jobId);
  if (!state) return;
  await writeState({ ...state, status: "generating" });

  try {
    const refs = refsOf(state);

    // Read brand DNA off the assets once, persist it for the paid package too.
    let paletteHex = state.paletteHex ?? [];
    let styleNotes = state.styleNotes ?? "";
    if (refs.length && !styleNotes) {
      const dna = await extractBrandDna(refs);
      paletteHex = dna.paletteHex;
      styleNotes = dna.styleNotes;
      const s0 = await readState(jobId);
      if (s0) await writeState({ ...s0, paletteHex, styleNotes });
    }

    const brief = { ...state, paletteHex, styleNotes };
    const prompts = await craftPrompts(brief, FREE_MODES);

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
      const partial = await readState(jobId);
      if (partial) await writeState({ ...partial, images: [...images] });
    }
    const fin = await readState(jobId);
    if (fin) await writeState({ ...fin, status: "ready", images });
    console.log("[chappieworks:photoshoot] preview ready", jobId, images.length);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[chappieworks:photoshoot] preview failed", jobId, message);
    const cur = await readState(jobId);
    if (cur) await writeState({ ...cur, status: "failed", failureReason: message });
  }
}

// Paid full brand identity package — runs after Stripe payment.
export async function runPackage(jobId: string): Promise<void> {
  const state = await readState(jobId);
  if (!state) return;
  if (state.packageStatus === "ready") return;
  await writeState({ ...state, packageStatus: "generating" });

  try {
    const refs = refsOf(state);
    const brief = {
      ...state,
      paletteHex: state.paletteHex,
      styleNotes: state.styleNotes,
    };
    const prompts = await craftPrompts(brief, PACKAGE_MODES);

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
      const partial = await readState(jobId);
      if (partial) await writeState({ ...partial, packageImages: [...images] });
    }
    const fin = await readState(jobId);
    if (fin) await writeState({ ...fin, packageStatus: "ready", packageImages: images });
    console.log("[chappieworks:photoshoot] package ready", jobId, images.length);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[chappieworks:photoshoot] package failed", jobId, message);
    const cur = await readState(jobId);
    if (cur)
      await writeState({
        ...cur,
        packageStatus: "failed",
        packageFailureReason: message,
      });
  }
}
