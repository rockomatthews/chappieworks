import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

type Submission = {
  name: string;
  email: string;
  brand_name?: string;
  brand_description?: string;
  industry?: string;
  vibe?: string;
  color_palette?: string;
  reference_url?: string;
};

type GeneratedImage = {
  mode: ImageMode;
  modeLabel: string;
  size: "1024x1024" | "1024x1536" | "1536x1024";
  promptUsed: string;
  imageBase64: string; // raw PNG bytes, base64-encoded
};

type ImageMode = "hero_banner" | "social_card" | "moodboard";

const MODE_SPECS: Record<
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

const PREVIEW_MODES: ImageMode[] = ["hero_banner", "social_card", "moodboard"];

function verifySig(body: string, sig: string, secret: string): boolean {
  if (!sig || !secret) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  if (sig.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c] ?? c,
  );
}

async function craftImagePrompts(s: Submission): Promise<
  Record<ImageMode, string>
> {
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

  // Tolerate stray fences/preamble — find the first { and the matching close
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

async function generateImage(
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

function renderEmailHtml(s: Submission, images: GeneratedImage[]): string {
  const upsellUrl =
    process.env.NEXT_PUBLIC_STRIPE_LINK_PHOTOSHOOT_PACK ??
    "https://chappieworks.com/photoshoot";
  const brand = s.brand_name ?? "your brand";

  const cards = images
    .map(
      (img, i) => `
<div style="margin: 28px 0; border: 1px solid #2a2a2a; border-radius: 8px; overflow: hidden; background: #1a1a1d;">
  <img src="cid:image-${i}" alt="${escapeHtml(img.modeLabel)} for ${escapeHtml(brand)}" style="display: block; width: 100%; max-width: 600px; height: auto;" />
  <div style="padding: 14px 18px;">
    <div style="font-family: 'SF Mono', Menlo, monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #c9a437;">${escapeHtml(img.modeLabel)} · ${img.size}</div>
  </div>
</div>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif; background: #0b0b0c; color: #faf7ee; padding: 32px 16px; margin: 0;">
<div style="max-width: 640px; margin: 0 auto;">
  <div style="border-bottom: 2px solid #c9a437; padding-bottom: 14px; margin-bottom: 24px;">
    <div style="font-family: 'SF Mono', monospace; font-size: 11px; color: #c9a437; letter-spacing: 0.12em; text-transform: uppercase;">Chappie Works · Brand Aesthetic Preview</div>
    <h1 style="font-size: 22px; margin: 8px 0 0; font-weight: 600;">3 visuals for ${escapeHtml(brand)}, fresh from the studio</h1>
  </div>

  <p style="font-size: 15px; line-height: 1.6; color: rgba(250,247,238,0.85);">Hi ${escapeHtml(s.name)},</p>
  <p style="font-size: 15px; line-height: 1.6; color: rgba(250,247,238,0.85);">Scribe wrote the prompts. Forge ran them through gpt-image-1. Glass picked the modes. Here are three brand visuals based on the brief you sent — one of each: hero banner, social card, and moodboard.</p>

  ${cards}

  <div style="border: 1px solid rgba(201,164,55,0.4); border-radius: 10px; padding: 20px; margin: 32px 0; background: rgba(201,164,55,0.06);">
    <div style="font-family: 'SF Mono', monospace; font-size: 11px; color: #c9a437; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 10px;">Want the full pack?</div>
    <p style="font-size: 15px; line-height: 1.55; margin: 0 0 14px; color: #faf7ee;"><strong>The Brand Aesthetic Pack — $49</strong> gets you 10 polished visuals across all 7 modes: hero banner, social cards (3 variations), moodboard, ad creative pack (Meta + TikTok sized), brand pattern, and a vertical poster. All 2K. Delivered in minutes.</p>
    <a href="${upsellUrl}" style="display: inline-block; background: #c9a437; color: #0b0b0c; padding: 10px 22px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">Buy the full pack →</a>
  </div>

  <div style="font-size: 13px; line-height: 1.55; color: rgba(250,247,238,0.6); border-top: 1px solid #2a2a2a; padding-top: 18px; margin-top: 32px;">
    <p style="margin: 0 0 8px;">Questions? Use the Scribe chat widget at chappieworks.com — it knows your brief.</p>
    <p style="margin: 0;">Want a custom AI agent that does this on autopilot for your team? Brief a build at chappieworks.com/agents.</p>
  </div>
</div>
</body></html>`;
}

async function sendPreviewEmail(
  s: Submission,
  images: GeneratedImage[],
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INTAKE_FROM_EMAIL ?? "intake@chappieworks.com";
  const bcc = process.env.INTAKE_NOTIFY_EMAIL;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY missing" };

  const brand = s.brand_name ?? "your brand";
  const subject = `Your 3-image brand preview — ${brand}`;
  const html = renderEmailHtml(s, images);

  const attachments = images.map((img, i) => ({
    filename: `${img.mode}-${img.size}.png`,
    content: img.imageBase64,
    content_id: `image-${i}`,
  }));

  const payload: Record<string, unknown> = {
    from: `Chappie Works <${from}>`,
    to: [s.email],
    reply_to: bcc ?? from,
    subject,
    html,
    attachments,
  };
  if (bcc) payload.bcc = [bcc];

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    return { ok: false, status: res.status, error: await res.text() };
  }
  return { ok: true };
}

export async function POST(req: Request) {
  const secret = process.env.INTAKE_WEBHOOK_SECRET ?? "";
  const sig = req.headers.get("x-chappie-sig") ?? "";
  const rawBody = await req.text();

  if (!verifySig(rawBody, sig, secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let submission: Submission;
  try {
    submission = JSON.parse(rawBody) as Submission;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!submission.email || !submission.name || !submission.brand_description) {
    return NextResponse.json(
      { error: "missing required fields" },
      { status: 400 },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error(
      "[chappieworks:photoshoot] OPENAI_API_KEY not set — pipeline cannot run",
    );
    return NextResponse.json(
      { ok: false, error: "openai key not configured" },
      { status: 503 },
    );
  }

  console.log(
    "[chappieworks:photoshoot] starting preview for",
    submission.email,
    submission.brand_name,
  );

  try {
    const prompts = await craftImagePrompts(submission);

    const images: GeneratedImage[] = [];
    for (const mode of PREVIEW_MODES) {
      const spec = MODE_SPECS[mode];
      const prompt = prompts[mode];
      const b64 = await generateImage(prompt, spec.size);
      images.push({
        mode,
        modeLabel: spec.label,
        size: spec.size,
        promptUsed: prompt,
        imageBase64: b64,
      });
    }

    const send = await sendPreviewEmail(submission, images);
    if (!send.ok) {
      console.error(
        "[chappieworks:photoshoot] send failed",
        send.status,
        send.error,
      );
      return NextResponse.json(
        { ok: false, stage: "send", detail: send.error },
        { status: 502 },
      );
    }
    console.log(
      "[chappieworks:photoshoot] preview sent to",
      submission.email,
      "images",
      images.length,
    );
    return NextResponse.json({ ok: true, images: images.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[chappieworks:photoshoot] failed", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
