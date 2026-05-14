import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Auth — Vercel sets CRON_SECRET and passes it as Authorization: Bearer <token>
// ---------------------------------------------------------------------------
function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

// ---------------------------------------------------------------------------
// News sources
// ---------------------------------------------------------------------------
type Story = { title: string; url: string; score?: number; source: string };

async function fetchHnStories(): Promise<Story[]> {
  try {
    const since = Math.floor((Date.now() - 86400 * 1000) / 1000);
    const res = await fetch(
      `https://hn.algolia.com/api/v1/search_by_date?query=AI+agent+agency&tags=story&numericFilters=created_at_i>${since},points>10&hitsPerPage=20`,
      { cache: "no-store" }
    );
    const data = await res.json();
    return (data.hits ?? []).slice(0, 10).map((h: { title: string; url?: string; objectID: string; points?: number }) => ({
      title: h.title,
      url: h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`,
      score: h.points,
      source: "Hacker News",
    }));
  } catch {
    return [];
  }
}

async function fetchRssFeed(feedUrl: string, sourceName: string): Promise<Story[]> {
  try {
    const res = await fetch(feedUrl, { cache: "no-store" });
    const xml = await res.text();
    const items: Story[] = [];
    const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
    for (const match of itemMatches) {
      const block = match[1];
      const title = block.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1]?.trim();
      const link = block.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/)?.[1]?.trim()
        ?? block.match(/<guid[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/guid>/)?.[1]?.trim();
      if (title && link) items.push({ title, url: link, source: sourceName });
      if (items.length >= 5) break;
    }
    return items;
  } catch {
    return [];
  }
}

async function gatherStories(): Promise<Story[]> {
  const [hn, techcrunch, venturebeat] = await Promise.all([
    fetchHnStories(),
    fetchRssFeed("https://techcrunch.com/tag/artificial-intelligence/feed/", "TechCrunch AI"),
    fetchRssFeed("https://venturebeat.com/category/ai/feed/", "VentureBeat AI"),
  ]);
  return [...hn, ...techcrunch, ...venturebeat].slice(0, 25);
}

// ---------------------------------------------------------------------------
// Claude distillation
// ---------------------------------------------------------------------------
async function distillSignals(stories: Story[], briefDate: string): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const storyList = stories
    .map((s, i) => `${i + 1}. [${s.source}] ${s.title}\n   ${s.url}`)
    .join("\n");

  const msg = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 1200,
    messages: [
      {
        role: "user",
        content: `You are Chappie, an autonomous AI agent writing the daily AI Agency Brief for ${briefDate}. Your subscribers are founders and operators of AI-powered service businesses.

Here are today's raw stories:
${storyList}

Pick the 3 most signal-rich items for an AI agency operator and write a tight brief. Format:

SIGNAL 1 — [headline, max 10 words]
[2-3 sentences: what happened, why it matters for an AI agency, one concrete implication]
Source: [URL]

SIGNAL 2 — [headline, max 10 words]
[2-3 sentences]
Source: [URL]

SIGNAL 3 — [headline, max 10 words]
[2-3 sentences]
Source: [URL]

CHAPPIE'S TAKE — [one sentence: what I'm doing with this intel today]

Write like a practitioner, not a journalist. No fluff. No "as AI continues to evolve." Skip stories that aren't directly relevant to running an AI agency.`,
      },
    ],
  });

  const block = msg.content[0];
  return block.type === "text" ? block.text : "(distillation failed)";
}

// ---------------------------------------------------------------------------
// Stripe subscriber fetch
// ---------------------------------------------------------------------------
async function getSubscriberEmails(): Promise<string[]> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.warn("[brief:cron] STRIPE_SECRET_KEY not set — skipping subscriber fetch");
    return [];
  }

  const productId = process.env.STRIPE_PRODUCT_ID_BRIEF;
  const url = productId
    ? `https://api.stripe.com/v1/subscriptions?status=active&expand[]=data.customer&limit=100`
    : `https://api.stripe.com/v1/subscriptions?status=active&expand[]=data.customer&limit=100`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const data = await res.json();

  if (!data.data) return [];

  type StripeSub = { customer: { email?: string; id?: string; object?: string }; items?: { data?: Array<{ price?: { product?: string } }> } };
  const subs: StripeSub[] = data.data;
  return subs
    .filter((sub) => {
      if (!productId) return true;
      return sub.items?.data?.some((item) => item.price?.product === productId);
    })
    .map((sub) => sub.customer?.email)
    .filter((e): e is string => typeof e === "string" && e.includes("@"));
}

// ---------------------------------------------------------------------------
// Resend send
// ---------------------------------------------------------------------------
async function sendBrief(email: string, briefDate: string, bodyText: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.INTAKE_FROM_EMAIL ?? "brief@chappieworks.com";
  if (!key) throw new Error("RESEND_API_KEY not set");

  const lines = bodyText.split("\n");
  const htmlLines = lines.map((l) => {
    if (/^SIGNAL \d/.test(l)) return `<h3 style="color:#c9a84c;margin:24px 0 6px;font-family:monospace;font-size:13px;text-transform:uppercase;letter-spacing:0.1em">${l}</h3>`;
    if (/^CHAPPIE'S TAKE/.test(l)) return `<p style="margin:24px 0 4px;font-weight:600">${l}</p>`;
    if (/^Source:/.test(l)) return `<p style="font-size:12px;font-family:monospace;color:#888;margin:4px 0 0">${l}</p>`;
    if (l.trim() === "") return "<br>";
    return `<p style="margin:6px 0;line-height:1.6;color:#e0dcd4">${l}</p>`;
  });

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="background:#0b0b0c;color:#e0dcd4;font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
<p style="font-family:monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#c9a84c;margin:0 0 24px">CHAPPIE WORKS · AI AGENCY BRIEF · ${briefDate}</p>
${htmlLines.join("\n")}
<hr style="border:none;border-top:1px solid #222;margin:32px 0">
<p style="font-size:11px;font-family:monospace;color:#555">Chappie Works · <a href="https://chappieworks.com" style="color:#555">chappieworks.com</a> · You're subscribed to the AI Agency Brief. <a href="https://chappieworks.com/unsubscribe" style="color:#555">Unsubscribe</a></p>
</body></html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: email,
      subject: `AI Agency Brief — ${briefDate}`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error ${res.status}: ${err}`);
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const briefDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Denver",
  });

  console.log(`[brief:cron] starting — ${briefDate}`);

  // 1. Gather stories
  const stories = await gatherStories();
  console.log(`[brief:cron] gathered ${stories.length} stories`);

  if (stories.length === 0) {
    console.error("[brief:cron] no stories fetched — aborting");
    return NextResponse.json({ error: "no stories" }, { status: 500 });
  }

  // 2. Distill
  let briefBody: string;
  try {
    briefBody = await distillSignals(stories, briefDate);
    console.log(`[brief:cron] distilled ${briefBody.length} chars`);
  } catch (err) {
    console.error("[brief:cron] distillation failed", err);
    return NextResponse.json({ error: "distillation failed" }, { status: 500 });
  }

  // 3. Get subscribers
  const emails = await getSubscriberEmails();
  console.log(`[brief:cron] ${emails.length} active subscriber(s)`);

  if (emails.length === 0) {
    console.log("[brief:cron] no subscribers yet — brief generated but not sent");
    return NextResponse.json({ ok: true, sent: 0, preview: briefBody });
  }

  // 4. Send
  let sent = 0;
  let errors = 0;
  for (const email of emails) {
    try {
      await sendBrief(email, briefDate, briefBody);
      sent++;
    } catch (err) {
      console.error(`[brief:cron] send failed for ${email}`, err);
      errors++;
    }
  }

  console.log(`[brief:cron] done — sent=${sent} errors=${errors}`);
  return NextResponse.json({ ok: true, sent, errors, briefDate });
}
