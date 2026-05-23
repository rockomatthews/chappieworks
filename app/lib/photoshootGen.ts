import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export type PhotoshootBrief = {
  name?: string;
  email?: string;
  brand_name?: string;
  brand_description?: string;
  industry?: string;
  vibe?: string;
  color_palette?: string;
  reference_url?: string;
};

export type ImageMode = "hero_banner" | "social_card" | "moodboard";

export type GeneratedImage = {
  mode: ImageMode;
  modeLabel: string;
  size: "1024x1024" | "1024x1536" | "1536x1024";
  promptUsed: string;
  imageBase64: string;
};

export const MODE_SPECS: Record<
  ImageMode,
  { label: string; size: GeneratedImage["size"]; intent: string }
> = {
  hero_banner: {
    label: "Hero Banner",
    size: "1536x1024",
    intent:
      "A wide cinematic hero image suitable for a website header or LinkedIn banner. Emphasis on brand atmosphere, depth, and a focal element that holds the eye at small sizes.",
  },
  social_card: {
    label: "Social Card",
    size: "1024x1024",
    intent:
      "A square brand visual for Instagram, LinkedIn, or X. Strong composition that reads on a small mobile feed thumbnail. No text — the visual carries the message.",
  },
  moodboard: {
    label: "Moodboard / Pinterest",
    size: "1024x1536",
    intent:
      "A vertical 2:3 aesthetic image that captures the brand's mood — texture, palette, lighting. Designed to live on Pinterest, brand decks, or pitch documents.",
  },
};

export const PREVIEW_MODES: ImageMode[] = ["hero_banner", "social_card", "moodboard"];

export async function craftImagePrompts(
  s: PhotoshootBrief,
): Promise<Record<ImageMode, string>> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const briefingPrompt = `You are Scribe, the writer on Chappie Studio's autonomous AI team. Your job here is to translate a customer's brand brief into 3 image-generation prompts — one per mode — that an image model (gpt-image-1) will execute.

Customer brief:
- Brand name: ${s.brand_name ?? "(not provided)"}
- Description: ${s.brand_description ?? "(not provided)"}
- Industry: ${s.industry ?? "(not provided)"}
- Vibe: ${s.vibe ?? "(not provided)"}
- Color palette: ${s.color_palette ?? "(not provided)"}
- Reference URL: ${s.reference_url ?? "(not provided)"}

You will write 3 image prompts, one for each mode. Each must:
- Open with the visual subject and composition in a single sentence
- Specify lighting, palette, mood, and texture — concrete descriptors, no abstractions like "professional" or "modern"
- Be self-contained (the image model has no context outside this prompt)
- Avoid any text rendering ("no text", "no typography", "no logo") — the image model is unreliable with text
- Avoid stock-photo tropes (no smiling diverse team handshakes, no abstract glowing networks)
- Be 60–120 words

Modes:
1. **hero_banner** (16:9 wide) — ${MODE_SPECS.hero_banner.intent}
2. **social_card** (1:1 square) — ${MODE_SPECS.social_card.intent}
3. **moodboard** (2:3 vertical) — ${MODE_SPECS.moodboard.intent}

Return EXACTLY this JSON shape, no preamble, no markdown fence:
{"hero_banner":"…prompt…","social_card":"…prompt…","moodboard":"…prompt…"}`;

  const result = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 1500,
    messages: [{ role: "user", content: briefingPrompt }],
  });
  const block = result.content[0];
  const raw = block?.type === "text" ? block.text.trim() : "";

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("scribe returned no JSON object");
  }
  const json = raw.slice(start, end + 1);
  const parsed = JSON.parse(json) as Record<string, string>;

  const out: Record<ImageMode, string> = {
    hero_banner: parsed.hero_banner?.trim() ?? "",
    social_card: parsed.social_card?.trim() ?? "",
    moodboard: parsed.moodboard?.trim() ?? "",
  };

  for (const m of PREVIEW_MODES) {
    if (!out[m] || out[m].length < 40) {
      throw new Error(`scribe returned short or empty prompt for ${m}`);
    }
  }
  return out;
}

export async function generateImage(
  prompt: string,
  size: GeneratedImage["size"],
): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
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
