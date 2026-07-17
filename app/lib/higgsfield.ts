// Higgsfield unified API — IMAGE pilot for /photoshoot. One API in front of the
// same Nano Banana / Seedream models we call direct, plus Sora/Veo/Kling for a
// future /movie unification. Contract reverse-engineered from the official SDK
// (github.com/higgsfield-ai/higgsfield-client):
//   base   https://platform.higgsfield.ai
//   auth   Authorization: Key {HF_KEY}    (HF_KEY = "apikey:apisecret")
//   submit POST /{model}  json=args  → { request_id, status_url, cancel_url }
//   poll   GET {status_url} → { status, images: [{ url }] }
//   status queued | in_progress | completed | failed | nsfw | canceled
//
// This is a PILOT: it only runs when IMAGE_BACKEND=higgsfield, and generateImage
// falls back to fal on any error — so production is never at its mercy.

const HF_BASE = "https://platform.higgsfield.ai";

// Model paths overridable via env. Seedream v4 is the documented image model;
// swap to nano-banana etc. without a deploy.
export const HF_IMAGE_T2I =
  process.env.HF_IMAGE_T2I_MODEL ?? "bytedance/seedream/v4/text-to-image";
export const HF_IMAGE_EDIT =
  process.env.HF_IMAGE_EDIT_MODEL ?? "bytedance/seedream/v4/edit";

function hfKey(): string {
  const combined = process.env.HF_KEY;
  if (combined) return combined;
  const k = process.env.HF_API_KEY;
  const s = process.env.HF_API_SECRET;
  if (k && s) return `${k}:${s}`;
  throw new Error("HF_KEY (or HF_API_KEY + HF_API_SECRET) not set");
}

export function higgsfieldEnabled(): boolean {
  return (
    (process.env.IMAGE_BACKEND ?? "").toLowerCase() === "higgsfield" &&
    Boolean(process.env.HF_KEY || (process.env.HF_API_KEY && process.env.HF_API_SECRET))
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Generate one image. Returns base64 PNG (same contract as the fal path in
// photoshootGen.generateImage). Submits, polls, downloads.
export async function higgsfieldImage(opts: {
  prompt: string;
  aspectRatio: string; // "3:2" | "1:1" | "2:3"
  referenceUrls?: string[];
}): Promise<string> {
  const headers = {
    Authorization: `Key ${hfKey()}`,
    "Content-Type": "application/json",
  };

  const useEdit = Boolean(opts.referenceUrls && opts.referenceUrls.length);
  const model = useEdit ? HF_IMAGE_EDIT : HF_IMAGE_T2I;
  const args: Record<string, unknown> = {
    prompt: opts.prompt,
    aspect_ratio: opts.aspectRatio,
    resolution: "2K",
  };
  if (useEdit) args.image_urls = opts.referenceUrls!.slice(0, 4);

  const submit = await fetch(`${HF_BASE}/${model}`, {
    method: "POST",
    headers,
    body: JSON.stringify(args),
  });
  const submitText = await submit.text();
  if (!submit.ok) {
    throw new Error(`higgsfield submit ${submit.status}: ${submitText.slice(0, 240)}`);
  }
  let sub: { request_id?: string; status_url?: string } = {};
  try {
    sub = JSON.parse(submitText);
  } catch {
    throw new Error(`higgsfield submit: non-JSON ${submitText.slice(0, 120)}`);
  }
  const rawStatusUrl = sub.status_url;
  if (!rawStatusUrl) throw new Error("higgsfield submit: no status_url");
  const statusUrl = rawStatusUrl.startsWith("http")
    ? rawStatusUrl
    : `${HF_BASE}${rawStatusUrl.startsWith("/") ? "" : "/"}${rawStatusUrl}`;

  const started = Date.now();
  for (;;) {
    if (Date.now() - started > 120_000) {
      throw new Error("higgsfield poll timeout (120s)");
    }
    await sleep(2000);
    const pr = await fetch(statusUrl, { headers, cache: "no-store" });
    if (!pr.ok) continue; // transient — keep polling until the budget runs out
    const pd = (await pr.json()) as {
      status?: string;
      images?: Array<{ url?: string } | string>;
      error?: string;
    };
    const status = (pd.status ?? "").toLowerCase();
    if (status === "failed" || status === "canceled") {
      throw new Error(`higgsfield ${status}: ${pd.error ?? "no detail"}`);
    }
    if (status === "nsfw") {
      throw new Error("higgsfield flagged the generation nsfw");
    }
    if (status !== "completed") continue;

    const first = pd.images?.[0];
    const url = typeof first === "string" ? first : first?.url;
    if (!url) throw new Error("higgsfield completed but no image url");
    const imgRes = await fetch(url);
    if (!imgRes.ok) throw new Error(`higgsfield image fetch ${imgRes.status}`);
    return Buffer.from(await imgRes.arrayBuffer()).toString("base64");
  }
}
