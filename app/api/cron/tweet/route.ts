import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { postTweet, hasXCreds } from "@/app/lib/x";

// Twice-daily autopost to @chappieworks. Mirrors /api/cron/brief: Vercel sets
// CRON_SECRET and passes it as Authorization: Bearer <token>. The route writes
// the tweet with Claude in Chappie's voice (real context: recent commits + the
// SKU facts), then posts via the dependency-free OAuth 1.0a client in lib/x.
//
// Slot: ?slot=am|pm (or derived from UTC hour). am = what we're shipping;
// pm = an offer/proof. ?dry=1 generates + returns the draft without posting.

// Accept either the Vercel-cron CRON_SECRET or a dedicated X_AUTOPOST_TOKEN so a
// Claude Code routine (visible in the routines list, alongside the standup) can
// trigger this without holding the broader CRON_SECRET. The X creds never leave
// Vercel — the routine is just the scheduled trigger.
function isAuthorized(req: Request): boolean {
  const auth = req.headers.get("authorization");
  const cron = process.env.CRON_SECRET;
  const autopost = process.env.X_AUTOPOST_TOKEN;
  if (cron && auth === `Bearer ${cron}`) return true;
  if (autopost && auth === `Bearer ${autopost}`) return true;
  return false;
}

// Recent shipped work, straight from the public repo (no git in serverless).
async function recentCommits(): Promise<string[]> {
  try {
    const res = await fetch(
      "https://api.github.com/repos/rockomatthews/chappieworks/commits?per_page=8",
      { headers: { Accept: "application/vnd.github+json" }, cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{ commit: { message: string } }>;
    return data
      .map((c) => c.commit.message.split("\n")[0])
      .filter((m) => !/^Merge|^chore\(standup\)/.test(m))
      .slice(0, 6);
  } catch {
    return [];
  }
}

// Stable business facts — the proof/offer slot draws from these. Keep accurate.
const BUSINESS_FACTS = `Chappie Works (chappieworks.com) — a productized AI studio run as seven personas (Chappie, Glass, Forge, Vault, Bench, Skeptic, Scribe), one bot, overseen by founder Rob Matthews.
Sells: Custom AI agents ($500–$1,500, 5–7 days, you own the code). Lead magnets (free): SEO audit, paid-ads audit. Other SKUs: /movie (AI video), /photoshoot (brand images), the AI Agency Brief (daily intel, $29–$59/mo).
Sister site chappiethebot.com = the build-in-public Million Chase log. Voice: terse, specific, slightly cocky, no MBA jargon, receipts over hype ("money or it didn't happen").`;

async function writeTweet(slot: "am" | "pm", commits: string[]): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const slotBrief =
    slot === "am"
      ? `Write a BUILD tweet: what the studio is shipping/building right now. Draw from these recent commits (paraphrase into plain English, no hashes, no jargon):\n${commits.map((c) => `- ${c}`).join("\n") || "- (quiet build day; talk about the studio model instead)"}`
      : `Write an OFFER/PROOF tweet: surface one concrete thing a buyer can act on (a custom agent build, a free SEO or paid-ads audit, or a real number). Make it easy to say yes to.`;

  const msg = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: `You are Chappie, the founder-bot of Chappie Works, writing a single tweet for @chappieworks.

${BUSINESS_FACTS}

${slotBrief}

Rules:
- ONE tweet, max 270 characters. Hard limit — count them.
- Chappie's voice: terse, concrete, slightly cocky. No hashtags. At most one emoji, usually none.
- No "excited to announce", no "as AI evolves", no thread, no quotes around the tweet.
- It's fine to point to chappieworks.com or a specific path (e.g. chappieworks.com/agents).
- Output ONLY the tweet text, nothing else.`,
      },
    ],
  });

  const block = msg.content[0];
  const text = block.type === "text" ? block.text.trim() : "";
  // Strip accidental wrapping quotes; clamp to 280.
  return text.replace(/^["']|["']$/g, "").slice(0, 280);
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dry = url.searchParams.get("dry") === "1";
  const hourUTC = new Date().getUTCHours();
  const slot = (url.searchParams.get("slot") as "am" | "pm" | null) ?? (hourUTC < 20 ? "am" : "pm");

  const commits = slot === "am" ? await recentCommits() : [];

  let text: string;
  try {
    text = await writeTweet(slot, commits);
  } catch (err) {
    console.error("[tweet:cron] generation failed", err);
    return NextResponse.json({ error: "generation failed" }, { status: 500 });
  }

  if (dry) {
    return NextResponse.json({ ok: true, dry: true, slot, chars: text.length, text });
  }

  if (!hasXCreds()) {
    console.warn("[tweet:cron] X creds not set — generated but not posted");
    return NextResponse.json({ ok: true, posted: false, reason: "no-x-creds", slot, text });
  }

  try {
    const { id } = await postTweet(text);
    console.log(`[tweet:cron] posted ${slot} tweet id=${id}`);
    return NextResponse.json({ ok: true, posted: true, slot, id, text });
  } catch (err) {
    console.error("[tweet:cron] post failed", err);
    return NextResponse.json({ error: "post failed", detail: (err as Error).message }, { status: 502 });
  }
}
