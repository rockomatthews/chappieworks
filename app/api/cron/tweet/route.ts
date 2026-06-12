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

const KV_LAST = "tweet:last"; // last successfully posted text (avoid repeats)
const KV_RESULT = "tweet:lastresult"; // last run's result, for visibility

async function kvGet(key: string): Promise<string | null> {
  const base = process.env.KV_REST_API_URL;
  const tok = process.env.KV_REST_API_TOKEN;
  if (!base || !tok) return null;
  try {
    const res = await fetch(`${base}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${tok}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return ((await res.json()) as { result?: string | null }).result ?? null;
  } catch {
    return null;
  }
}

async function kvSet(key: string, value: string): Promise<void> {
  const base = process.env.KV_REST_API_URL;
  const tok = process.env.KV_REST_API_TOKEN;
  if (!base || !tok) return;
  try {
    await fetch(`${base}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}` },
    });
  } catch {
    /* best-effort */
  }
}

function looksDuplicate(msg: string): boolean {
  return /duplicate|187|already (posted|said)|status is a duplicate/i.test(msg);
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

async function writeTweet(
  slot: "am" | "pm",
  commits: string[],
  avoid?: string,
  extraNudge?: string,
): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const today = new Date().toISOString().slice(0, 10);
  const avoidClause = avoid
    ? `\n\nIMPORTANT — do NOT repeat or closely paraphrase your most recent tweet (X rejects duplicates). Your last tweet was:\n"${avoid}"\nPick a genuinely different angle, opening, and example.`
    : "";
  const variety = `\n\nFor freshness, vary structure run-to-run (today is ${today}): sometimes lead with a number, sometimes a sharp claim, sometimes a question, sometimes a one-line story. Never open the same way twice.${extraNudge ? `\n${extraNudge}` : ""}`;

  const slotBrief =
    slot === "am"
      ? `Write a BUILD tweet: what the studio is shipping/building right now. Draw from these recent commits (paraphrase into plain English, no hashes, no jargon):\n${commits.map((c) => `- ${c}`).join("\n") || "- (quiet build day; talk about the studio model instead)"}`
      : `Write an OFFER/PROOF tweet: surface one concrete thing a buyer can act on (a custom agent build, a free SEO or paid-ads audit, or a real number). Make it easy to say yes to.`;

  const msg = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: `You are Chappie, the founder-bot of Chappie Works, writing a single tweet for @chappieworks.

${BUSINESS_FACTS}

${slotBrief}${avoidClause}${variety}

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
  // ?status=1 → just return the last run's logged result (no generation/post).
  if (url.searchParams.get("status") === "1") {
    const raw = await kvGet(KV_RESULT);
    return NextResponse.json({ ok: true, lastResult: raw ? JSON.parse(raw) : null });
  }
  const dry = url.searchParams.get("dry") === "1";
  const hourUTC = new Date().getUTCHours();
  const slot = (url.searchParams.get("slot") as "am" | "pm" | null) ?? (hourUTC < 20 ? "am" : "pm");

  const commits = slot === "am" ? await recentCommits() : [];
  const lastPosted = (await kvGet(KV_LAST)) ?? undefined;

  let text: string;
  try {
    text = await writeTweet(slot, commits, lastPosted);
  } catch (err) {
    console.error("[tweet:cron] generation failed", err);
    await kvSet(KV_RESULT, JSON.stringify({ at: new Date().toISOString(), posted: false, slot, error: `generation: ${(err as Error).message}` }));
    return NextResponse.json(
      { error: "generation failed", detail: (err as Error).message },
      { status: 500 }
    );
  }

  if (dry) {
    return NextResponse.json({ ok: true, dry: true, slot, chars: text.length, text });
  }

  if (!hasXCreds()) {
    console.warn("[tweet:cron] X creds not set — generated but not posted");
    await kvSet(KV_RESULT, JSON.stringify({ at: new Date().toISOString(), posted: false, slot, error: "no-x-creds" }));
    return NextResponse.json({ ok: true, posted: false, reason: "no-x-creds", slot, text });
  }

  // Post, with one regenerate-and-retry if X rejects it as a duplicate.
  let lastErr = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { id } = await postTweet(text);
      console.log(`[tweet:cron] posted ${slot} tweet id=${id}`);
      await kvSet(KV_LAST, text);
      await kvSet(KV_RESULT, JSON.stringify({ at: new Date().toISOString(), posted: true, slot, id, text }));
      return NextResponse.json({ ok: true, posted: true, slot, id, text });
    } catch (err) {
      lastErr = (err as Error).message;
      console.error(`[tweet:cron] post failed (attempt ${attempt + 1})`, lastErr);
      if (attempt === 0 && looksDuplicate(lastErr)) {
        // Regenerate with a stronger push for novelty, then retry once.
        try {
          text = await writeTweet(slot, commits, text, "Your previous attempt was rejected as a duplicate — write something clearly different in topic and wording.");
          continue;
        } catch {
          break;
        }
      }
      break;
    }
  }
  await kvSet(KV_RESULT, JSON.stringify({ at: new Date().toISOString(), posted: false, slot, error: lastErr, text }));
  return NextResponse.json({ error: "post failed", detail: lastErr }, { status: 502 });
}
