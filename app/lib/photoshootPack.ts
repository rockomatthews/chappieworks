import { put, list } from "@vercel/blob";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { escapeHtml } from "./movieEmail";

// The brief the buyer submits — same shape as the free preview's intake plus
// name + email at the top.
export type PhotoshootBrief = {
  name: string;
  email: string;
  brand_name: string;
  brand_description: string;
  industry: string;
  vibe: string;
  color_palette?: string;
  reference_url?: string;
};

export type PackStatus =
  | "pending" // brief saved, awaiting payment
  | "generating" // payment received (or bypass), images rendering
  | "delivered" // emailed successfully
  | "failed";

export type PackState = {
  packId: string;
  createdAt: string;
  status: PackStatus;
  brief: PhotoshootBrief;
  stripeSessionId?: string;
  bypass?: boolean;
  // Blob URLs of the 10 delivered images, keyed by mode-variant.
  images?: { mode: PackMode; label: string; size: ImgSize; url: string }[];
  deliveredAt?: string;
  failureReason?: string;
};

const STATE_KEY = (packId: string) => `photoshoot-pack/${packId}/state.json`;

export function newPackId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function writePackState(state: PackState): Promise<void> {
  await put(STATE_KEY(state.packId), JSON.stringify(state, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function readPackState(packId: string): Promise<PackState | null> {
  const { blobs } = await list({ prefix: STATE_KEY(packId) });
  const blob = blobs.find((b) => b.pathname === STATE_KEY(packId));
  if (!blob) return null;
  const res = await fetch(blob.url, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as PackState;
}

// 10 visuals across 7 modes. Some modes have multiple variants so the buyer
// gets meaningful breadth on a feed (3 social cards lets them A/B test).
export type ImgSize = "1024x1024" | "1024x1536" | "1536x1024";
export type PackMode =
  | "hero_banner"
  | "social_card_a"
  | "social_card_b"
  | "social_card_c"
  | "moodboard"
  | "ad_creative_meta"
  | "ad_creative_tiktok"
  | "brand_pattern"
  | "vertical_poster"
  | "featured_product";

type PackModeSpec = {
  label: string;
  size: ImgSize;
  intent: string;
};

export const PACK_SPECS: Record<PackMode, PackModeSpec> = {
  hero_banner: {
    label: "Hero Banner",
    size: "1536x1024",
    intent:
      "A wide cinematic hero image for a website header or LinkedIn banner. Brand atmosphere with depth and a clear focal element that reads small.",
  },
  social_card_a: {
    label: "Social Card · A",
    size: "1024x1024",
    intent:
      "Square brand visual for Instagram, LinkedIn, X. First of three variants — go with the clearest, boldest hero composition.",
  },
  social_card_b: {
    label: "Social Card · B",
    size: "1024x1024",
    intent:
      "Square brand visual, variant B. Pull a different angle/scene from the brief than card A — a detail shot, environmental scene, or alt composition.",
  },
  social_card_c: {
    label: "Social Card · C",
    size: "1024x1024",
    intent:
      "Square brand visual, variant C. Use a contrasting mood from cards A and B — if A and B are clean, go atmospheric; if they are warm, go cool. The buyer A/B tests these.",
  },
  moodboard: {
    label: "Moodboard / Pinterest",
    size: "1024x1536",
    intent:
      "Vertical 2:3 aesthetic image — texture, palette, lighting. For Pinterest, brand decks, pitch documents.",
  },
  ad_creative_meta: {
    label: "Ad Creative · Meta",
    size: "1536x1024",
    intent:
      "Landscape ad creative suitable for Facebook/Instagram feed. Clear focal subject, strong visual hierarchy, leaves room for headline text overlay (do NOT render text).",
  },
  ad_creative_tiktok: {
    label: "Ad Creative · TikTok",
    size: "1024x1536",
    intent:
      "Vertical 9:16-ish ad creative for TikTok or Reels. Native-feeling composition — looks shot on phone, not stocky. Subject framed in top 60% so platform UI does not cover the focal point.",
  },
  brand_pattern: {
    label: "Brand Pattern",
    size: "1024x1024",
    intent:
      "Seamless tileable texture or pattern matching the brand palette and vibe. Use as background for site sections, slide masters, packaging. Abstract — no recognizable subject.",
  },
  vertical_poster: {
    label: "Vertical Poster",
    size: "1024x1536",
    intent:
      "4:5 vertical long-form social visual. Stronger narrative composition than a social card — feels like a poster or magazine spread. No text.",
  },
  featured_product: {
    label: "Featured Product",
    size: "1024x1024",
    intent:
      "Square hero spotlighting the brand's primary offer or product type. Catalog-grade lighting, clear hero element, no clutter.",
  },
};

export const PACK_MODES: PackMode[] = [
  "hero_banner",
  "social_card_a",
  "social_card_b",
  "social_card_c",
  "moodboard",
  "ad_creative_meta",
  "ad_creative_tiktok",
  "brand_pattern",
  "vertical_poster",
  "featured_product",
];

// Translate brief → 10 image-gen prompts (one per mode) via Scribe (Anthropic).
async function craftPackPrompts(
  brief: PhotoshootBrief,
): Promise<Record<PackMode, string>> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const modeList = PACK_MODES.map(
    (m) =>
      `- **${m}** (${PACK_SPECS[m].size}, ${PACK_SPECS[m].label}) — ${PACK_SPECS[m].intent}`,
  ).join("\n");

  const briefingPrompt = `You are Scribe, the writer on Chappie Studio's autonomous AI team. Translate a customer's brand brief into 10 image-generation prompts — one per mode — that gpt-image-1 will execute.

Customer brief:
- Brand name: ${brief.brand_name}
- Description: ${brief.brand_description}
- Industry: ${brief.industry}
- Vibe: ${brief.vibe}
- Color palette: ${brief.color_palette ?? "(not provided)"}
- Reference URL: ${brief.reference_url ?? "(not provided)"}

You will write 10 image prompts, one for each mode. Each must:
- Open with the visual subject and composition in a single sentence
- Specify lighting, palette, mood, and texture — concrete descriptors, no abstractions like "professional" or "modern"
- Be self-contained (the image model has no context outside this prompt)
- Avoid any text rendering ("no text", "no typography", "no logo") — the image model is unreliable with text
- Avoid stock-photo tropes (no smiling diverse team handshakes, no abstract glowing networks)
- Be 60–120 words

Modes:
${modeList}

Return EXACTLY this JSON shape, no preamble, no markdown fence:
{${PACK_MODES.map((m) => `"${m}":"…prompt…"`).join(",")}}`;

  const result = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 4000,
    messages: [{ role: "user", content: briefingPrompt }],
  });
  const block = result.content[0];
  const raw = block?.type === "text" ? block.text.trim() : "";

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("scribe returned no JSON object for pack");
  }
  const parsed = JSON.parse(raw.slice(start, end + 1)) as Record<string, string>;

  const out: Record<PackMode, string> = {} as Record<PackMode, string>;
  for (const m of PACK_MODES) {
    const v = parsed[m]?.trim();
    if (!v || v.length < 40) {
      throw new Error(`scribe returned short or empty prompt for ${m}`);
    }
    out[m] = v;
  }
  return out;
}

async function generateOneImage(
  prompt: string,
  size: ImgSize,
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

function renderPackEmailHtml(
  brief: PhotoshootBrief,
  images: PackState["images"],
  bypass: boolean,
): string {
  const brand = brief.brand_name;
  const ribbon = bypass
    ? "Internal · Bypass · 10-pack"
    : "Brand Aesthetic Pack · Delivered";
  const intro = bypass
    ? "Internal delivery — no charge. Full 10-image Brand Aesthetic Pack below."
    : "Thanks for the purchase. Your full 10-image Brand Aesthetic Pack is ready.";

  const rows = (images ?? [])
    .map(
      (img) => `
<div style="margin: 22px 0; border: 1px solid #2a2a2a; border-radius: 8px; overflow: hidden; background: #1a1a1d;">
  <img src="${img.url}" alt="${escapeHtml(img.label)} for ${escapeHtml(brand)}" style="display: block; width: 100%; max-width: 600px; height: auto;" />
  <div style="padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
    <div>
      <div style="font-family: 'SF Mono', Menlo, monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #c9a437;">${escapeHtml(img.label)} · ${img.size}</div>
    </div>
    <a href="${img.url}" download style="display: inline-block; background: #c9a437; color: #0b0b0c; padding: 6px 14px; border-radius: 4px; text-decoration: none; font-weight: 600; font-size: 12px;">Download PNG →</a>
  </div>
</div>`,
    )
    .join("");

  return `<!DOCTYPE html><html><body style="font-family: -apple-system, system-ui, sans-serif; background:#0b0b0c; color:#faf7ee; padding:32px 16px; margin:0;">
<div style="max-width:640px; margin:0 auto;">
<div style="border-bottom:2px solid #c9a437; padding-bottom:14px; margin-bottom:24px;">
  <div style="font-family:'SF Mono', monospace; font-size:11px; color:#c9a437; letter-spacing:0.12em; text-transform:uppercase;">Chappie Works · ${ribbon}</div>
  <h1 style="font-size:22px; margin:8px 0 0; font-weight:600;">10 brand visuals for ${escapeHtml(brand)}.</h1>
</div>
<p style="font-size:15px; line-height:1.6; color:rgba(250,247,238,0.85);">${intro}</p>
<p style="font-size:14px; line-height:1.6; color:rgba(250,247,238,0.7);">All 10 visuals are below as 2K PNGs. Right-click to save or hit the Download PNG button. Files stay live on chappieworks.com for 30 days — pull what you need now.</p>
${rows}
<div style="font-size:13px; line-height:1.55; color:rgba(250,247,238,0.55); border-top:1px solid #2a2a2a; padding-top:18px; margin-top:32px;">
  <p style="margin:0 0 8px;">Commercial rights yours. Use them on your site, ads, social, decks, packaging — wherever.</p>
  <p style="margin:0;">Want the studio doing this monthly for your brand? <a href="https://chappieworks.com/agents" style="color:#c9a437;">Brief a custom agent build</a>.</p>
</div>
</div>
</body></html>`;
}

type SendResult =
  | { ok: true; id?: string }
  | { ok: false; status?: number; error: string };

async function sendPackEmail(
  brief: PhotoshootBrief,
  images: PackState["images"],
  bypass: boolean,
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INTAKE_FROM_EMAIL ?? "intake@chappieworks.com";
  const bcc = process.env.INTAKE_NOTIFY_EMAIL;
  if (!apiKey) {
    console.error("[chappieworks:pack] RESEND_API_KEY missing");
    return { ok: false, error: "RESEND_API_KEY missing" };
  }

  const brand = brief.brand_name;
  const subject = bypass
    ? `Brand Aesthetic Pack (internal bypass) — ${brand}`
    : `Your Brand Aesthetic Pack — ${brand}`;

  const payload: Record<string, unknown> = {
    from: `Chappie Works <${from}>`,
    to: [brief.email],
    reply_to: bcc ?? from,
    subject,
    html: renderPackEmailHtml(brief, images, bypass),
  };
  if (bcc) payload.bcc = [bcc];

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok) {
      console.error(
        "[chappieworks:pack] resend rejected",
        "status",
        res.status,
        "body",
        text,
      );
      return { ok: false, status: res.status, error: text };
    }
    let id: string | undefined;
    try {
      id = (JSON.parse(text) as { id?: string }).id;
    } catch {
      // ignore
    }
    console.log(
      "[chappieworks:pack] email sent to",
      brief.email,
      "resend id",
      id ?? "(none)",
    );
    return { ok: true, id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[chappieworks:pack] fetch threw", message);
    return { ok: false, error: message };
  }
}

// End-to-end: take a brief + packId, run Scribe → 10 parallel image gens →
// upload all to Blob → email the buyer. Updates state at each phase so
// idempotency checks downstream can see what's done.
export async function generatePackAndEmail(
  packId: string,
  opts: { stripeSessionId?: string; bypass?: boolean },
): Promise<{ ok: boolean; error?: string }> {
  const state = await readPackState(packId);
  if (!state) return { ok: false, error: "pack state missing" };
  if (state.status === "delivered") {
    console.log("[chappieworks:pack] already delivered, skipping", packId);
    return { ok: true };
  }

  const brief = state.brief;

  try {
    await writePackState({ ...state, status: "generating" });

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY missing");
    }

    const prompts = await craftPackPrompts(brief);
    console.log("[chappieworks:pack] prompts crafted", packId);

    // Parallel image generation. allSettled so one timeout doesn't blow the
    // whole pack. After we have results, fail loudly if too many missed.
    // Each settle also patches state with the new image so the live thanks
    // page can render visuals as they land instead of waiting for all 10.
    const results = await Promise.allSettled(
      PACK_MODES.map(async (mode) => {
        const spec = PACK_SPECS[mode];
        const b64 = await generateOneImage(prompts[mode], spec.size);
        const buf = Buffer.from(b64, "base64");
        const blob = await put(
          `photoshoot-pack/${packId}/${mode}.png`,
          buf,
          {
            access: "public",
            contentType: "image/png",
            addRandomSuffix: false,
            allowOverwrite: true,
          },
        );
        const img = { mode, label: spec.label, size: spec.size, url: blob.url };
        try {
          const current = await readPackState(packId);
          if (current) {
            const existing = current.images ?? [];
            const next = [
              ...existing.filter((i) => i.mode !== mode),
              img,
            ];
            await writePackState({ ...current, images: next });
          }
        } catch (e) {
          // Best-effort streaming update. The final write below catches up.
          console.warn(
            "[chappieworks:pack] incremental state write failed",
            packId,
            mode,
            e instanceof Error ? e.message : e,
          );
        }
        return img;
      }),
    );

    const images: NonNullable<PackState["images"]> = [];
    const failures: string[] = [];
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === "fulfilled") {
        images.push(r.value);
      } else {
        failures.push(`${PACK_MODES[i]}: ${r.reason}`);
      }
    }
    if (images.length < 8) {
      throw new Error(
        `only ${images.length}/10 images generated. Failures: ${failures.join("; ")}`,
      );
    }
    if (failures.length) {
      console.warn(
        "[chappieworks:pack] partial pack",
        packId,
        images.length,
        "of 10. Failures:",
        failures.join("; "),
      );
    }
    console.log(
      "[chappieworks:pack] images uploaded",
      packId,
      "count",
      images.length,
    );

    const sent = await sendPackEmail(brief, images, !!opts.bypass);
    if (!sent.ok) {
      await writePackState({
        ...state,
        status: "failed",
        images,
        failureReason: `email send failed: ${sent.error}`,
      });
      return { ok: false, error: sent.error };
    }

    await writePackState({
      ...state,
      status: "delivered",
      images,
      deliveredAt: new Date().toISOString(),
      stripeSessionId: opts.stripeSessionId ?? state.stripeSessionId,
      bypass: opts.bypass,
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[chappieworks:pack] generation failed", packId, message);
    await writePackState({
      ...state,
      status: "failed",
      failureReason: message,
    });
    return { ok: false, error: message };
  }
}
