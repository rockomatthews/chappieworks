import Anthropic from "@anthropic-ai/sdk";
import OpenAI, { toFile } from "openai";

export type PhotoshootBrief = {
  name?: string;
  email?: string;
  brand_name?: string;
  brand_description?: string;
  industry?: string;
  vibe?: string;
  color_palette?: string;
  reference_url?: string;
  // Brand DNA read off the uploaded assets (palette + style notes).
  paletteHex?: string[];
  styleNotes?: string;
};

// Free preview modes + paid full-identity-package modes.
export type ImageMode =
  | "key_visual"
  | "hero_banner"
  | "social_card"
  | "logo_treatment"
  | "palette_board"
  | "social_avatar"
  | "social_banner"
  | "ad_creative"
  | "brand_pattern";

type ImageSize = "1024x1024" | "1024x1536" | "1536x1024";

export const MODE_SPECS: Record<
  ImageMode,
  { label: string; size: ImageSize; intent: string }
> = {
  key_visual: {
    label: "Key Visual",
    size: "1024x1024",
    intent:
      "The single most alluring brand hero shot — a striking, premium key visual that captures the brand's world in one frame. Magazine-cover quality, rich lighting, a clear focal subject drawn from the brand's identity. This is the image that makes someone stop scrolling.",
  },
  hero_banner: {
    label: "Hero Banner",
    size: "1536x1024",
    intent:
      "A wide cinematic hero for a website header or LinkedIn banner. Brand atmosphere, depth, and a focal element that still reads at small sizes.",
  },
  social_card: {
    label: "Social Card",
    size: "1024x1024",
    intent:
      "A square brand visual for Instagram, LinkedIn, or X. Strong composition that reads as a small mobile thumbnail.",
  },
  logo_treatment: {
    label: "Logo Treatment",
    size: "1024x1024",
    intent:
      "The brand's logo (provided as a reference) presented as a polished brand mark on an on-brand backdrop — like a brand-guidelines hero. Keep the logo's shapes and colors faithful; surround it with tasteful negative space and subtle brand texture.",
  },
  palette_board: {
    label: "Color Palette Board",
    size: "1024x1024",
    intent:
      "A clean color-palette board: 5–6 large color swatches arranged in a grid or row, using the brand's exact colors, with subtle material/texture under each. Designer mood-board aesthetic. No text or hex codes — just the colors as blocks.",
  },
  social_avatar: {
    label: "Social Avatar",
    size: "1024x1024",
    intent:
      "A bold square profile avatar that works as a tiny circle — a simplified, iconic distillation of the brand mark/world. High contrast, instantly recognizable at 48px.",
  },
  social_banner: {
    label: "Social Banner",
    size: "1536x1024",
    intent:
      "A wide social cover/banner (X, LinkedIn, Facebook). Brand atmosphere with the focal interest offset so a centered avatar wouldn't collide with it.",
  },
  ad_creative: {
    label: "Ad Creative",
    size: "1024x1024",
    intent:
      "A scroll-stopping square ad creative for Meta/TikTok feeds. A single hero subject from the brand's world, dramatic light, generous clean space at the top for an overlaid headline (leave it empty — no text).",
  },
  brand_pattern: {
    label: "Brand Pattern",
    size: "1024x1024",
    intent:
      "A seamless, tileable background pattern/texture in the brand's palette — subtle and premium, the kind used behind slides, packaging, and section backgrounds. Abstract, no recognizable objects.",
  },
};

export const FREE_MODES: ImageMode[] = ["key_visual", "hero_banner", "social_card"];
export const PACKAGE_MODES: ImageMode[] = [
  "logo_treatment",
  "palette_board",
  "social_avatar",
  "social_banner",
  "ad_creative",
  "brand_pattern",
];
// Back-compat for any existing imports.
export const PREVIEW_MODES = FREE_MODES;

// Read brand DNA (palette + style) off the customer's uploaded assets so every
// generated visual is anchored to their real identity, not generic stock.
export async function extractBrandDna(
  imageUrls: string[],
): Promise<{ paletteHex: string[]; styleNotes: string }> {
  if (!imageUrls.length) return { paletteHex: [], styleNotes: "" };
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const content: Anthropic.MessageParam["content"] = imageUrls
    .slice(0, 4)
    .map((url) => ({ type: "image", source: { type: "url", url } }) as const);
  content.push({
    type: "text",
    text: `These are a brand's existing identity assets (logo and/or photos). Extract the brand's visual DNA so an image model can generate matching new visuals.

Return EXACTLY this JSON, no preamble:
{"paletteHex":["#RRGGBB", ... up to 6 dominant brand colors],"styleNotes":"2-3 sentences: the aesthetic, mood, lighting, materials, and any motifs. Concrete, no fluff."}`,
  });
  try {
    const msg = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 600,
      messages: [{ role: "user", content }],
    });
    const block = msg.content[0];
    const raw = block?.type === "text" ? block.text : "";
    const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
    const parsed = JSON.parse(json) as {
      paletteHex?: string[];
      styleNotes?: string;
    };
    return {
      paletteHex: (parsed.paletteHex ?? []).filter((h) => /^#[0-9a-f]{6}$/i.test(h)),
      styleNotes: (parsed.styleNotes ?? "").trim(),
    };
  } catch (err) {
    console.error("[chappieworks:photoshoot] brand DNA extract failed", err);
    return { paletteHex: [], styleNotes: "" };
  }
}

export async function craftPrompts(
  s: PhotoshootBrief,
  modes: ImageMode[],
): Promise<Record<string, string>> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const hasAssets = Boolean(s.paletteHex?.length || s.styleNotes);

  const modeList = modes
    .map((m, i) => `${i + 1}. **${m}** — ${MODE_SPECS[m].intent}`)
    .join("\n");

  const briefingPrompt = `You are Scribe on Chappie Studio's autonomous team. Translate this brand into image-generation prompts for gpt-image-1 — one per mode.

Customer brief:
- Brand: ${s.brand_name ?? "(not provided)"}
- Description: ${s.brand_description ?? "(not provided)"}
- Industry: ${s.industry ?? "(not provided)"}
- Vibe: ${s.vibe ?? "(not provided)"}
- Stated colors: ${s.color_palette ?? "(not provided)"}
${
  hasAssets
    ? `\nBRAND DNA read from the customer's REAL uploaded assets (anchor every prompt to this):
- Palette: ${s.paletteHex?.join(", ") || "(none)"}
- Style: ${s.styleNotes || "(none)"}
The customer's logo/photos are ALSO passed to the image model as reference images, so describe scenes that harmonize with them and reuse the palette above.`
    : ""
}

Write one prompt per mode. Each must:
- Open with the visual subject + composition in one sentence
- Specify lighting, palette (use the brand colors above), mood, texture — concrete, no "professional"/"modern"
- Be self-contained (the model sees nothing but this prompt + reference images)
- Say "no text, no typography, no lettering" (the model is unreliable with text)${hasAssets ? "" : ""}
- Avoid stock-photo tropes
- 50–110 words

Modes:
${modeList}

Return EXACTLY a JSON object keyed by the mode names above, values are the prompts. No markdown fence, no preamble.`;

  const result = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 2500,
    messages: [{ role: "user", content: briefingPrompt }],
  });
  const block = result.content[0];
  const raw = block?.type === "text" ? block.text.trim() : "";
  const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  const parsed = JSON.parse(json) as Record<string, string>;

  const out: Record<string, string> = {};
  for (const m of modes) {
    const p = parsed[m]?.trim();
    if (!p || p.length < 40) throw new Error(`scribe returned short prompt for ${m}`);
    out[m] = p;
  }
  return out;
}

// Back-compat wrapper (old name, free modes only).
export async function craftImagePrompts(
  s: PhotoshootBrief,
): Promise<Record<string, string>> {
  return craftPrompts(s, FREE_MODES);
}

// Generate one image. When reference assets are supplied, use gpt-image-1's edit
// endpoint with the brand's real logo/photos as references → on-brand output.
export async function generateImage(
  prompt: string,
  size: ImageSize,
  referenceUrls?: string[],
): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  if (referenceUrls && referenceUrls.length) {
    const files = await Promise.all(
      referenceUrls.slice(0, 4).map(async (url, i) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`reference fetch ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        const type = res.headers.get("content-type") ?? "image/png";
        const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
        return toFile(buf, `ref-${i}.${ext}`, { type });
      }),
    );
    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: files,
      prompt,
      size,
      quality: "medium",
      n: 1,
    });
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw new Error("openai edit returned no image data");
    return b64;
  }

  const result = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    size,
    quality: "medium",
    n: 1,
  });
  const b64 = result.data?.[0]?.b64_json;
  if (!b64) throw new Error("openai returned no image data");
  return b64;
}
