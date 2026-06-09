import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import {
  getUserId,
  getMentions,
  postTweet,
  hasXCreds,
  type MentionTweet,
} from "@/app/lib/x";
import { CHAPPIE_VOICE } from "@/app/lib/chappieVoice";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Mention-reply bot: when people mention @chappieworks, Chappie replies ONCE per
// person, up to DAILY_CAP per day, each reply ending with "(post N/5)". Triggered
// by a Claude routine on a schedule (same auth as the tweet/roast crons).
// ?dry=1 reads + drafts without posting — used to verify the mentions read works
// on our X API tier before going live.

const SELF = "chappieworks";
const SKIP_HANDLES = new Set(["chappieworks", "zssbecker"]); // self + roast target (no loops)
const DAILY_CAP = 5;
const STATE_KEY = "mentions:state";
const WATERMARK_KEY = "mentions:lastid";

function isAuthorized(req: Request): boolean {
  const auth = req.headers.get("authorization");
  const cron = process.env.CRON_SECRET;
  const autopost = process.env.X_AUTOPOST_TOKEN;
  if (cron && auth === `Bearer ${cron}`) return true;
  if (autopost && auth === `Bearer ${autopost}`) return true;
  return false;
}

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
    const j = (await res.json()) as { result?: string | null };
    return j.result ?? null;
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

type DayState = { date: string; count: number; users: string[] };

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

async function loadDayState(): Promise<DayState> {
  const today = todayUTC();
  const raw = await kvGet(STATE_KEY);
  if (raw) {
    try {
      const s = JSON.parse(raw) as DayState;
      if (s.date === today && Array.isArray(s.users)) return s;
    } catch {
      /* fall through to fresh */
    }
  }
  return { date: today, count: 0, users: [] };
}

async function writeReply(m: MentionTweet): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `${CHAPPIE_VOICE}

Someone (@${m.authorUsername ?? "a user"}) mentioned @chappieworks on X with:
"${m.text.replace(/\n+/g, " ").slice(0, 280)}"

Write ONE short reply AS CHAPPIE.
Rules:
- Max 230 characters (a counter is appended after, so stay tight). No hashtags. No @mention (the reply auto-mentions them). At most one emoji, usually none.
- If it's a real question about the studio, the agents, or the SKUs (custom AI agents, free SEO/ads audits, /movie, /photoshoot), answer it usefully and concretely.
- If it's banter, banter back — dry, blunt, a little mischievous. If it's hostile, deflect with humor; never insult the person.
- Output ONLY the reply text, nothing else.`,
      },
    ],
  });
  const block = msg.content[0];
  return (block.type === "text" ? block.text.trim() : "")
    .replace(/^["']|["']$/g, "")
    .slice(0, 230);
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const dry = new URL(req.url).searchParams.get("dry") === "1";

  let mentions: MentionTweet[];
  let newestId: string | undefined;
  try {
    const userId = await getUserId(SELF);
    const sinceId = (await kvGet(WATERMARK_KEY)) ?? undefined;
    mentions = await getMentions(userId, { sinceId, maxResults: 30 });
    newestId = mentions[0]?.id; // API returns newest first
  } catch (err) {
    console.error("[mentions-reply] read failed", err);
    return NextResponse.json(
      { error: "read failed", detail: (err as Error).message },
      { status: 502 }
    );
  }

  const state = await loadDayState();
  // Process oldest-first so the first people to mention us get the day's slots.
  const ordered = [...mentions].reverse();
  const results: Array<{ to?: string; replyId?: string; text: string }> = [];
  const skipped: string[] = [];

  for (const m of ordered) {
    if (state.count >= DAILY_CAP) break;
    const handle = m.authorUsername?.toLowerCase();
    if (!m.authorId) continue;
    if (m.isRetweet) continue;
    if (handle && SKIP_HANDLES.has(handle)) continue;
    if (state.users.includes(m.authorId)) {
      skipped.push(`@${m.authorUsername} (already replied today)`);
      continue;
    }

    let reply: string;
    try {
      reply = await writeReply(m);
    } catch (err) {
      console.error("[mentions-reply] generation failed", m.id, err);
      continue;
    }
    const nextCount = state.count + 1;
    const body = `${reply} (post ${nextCount}/${DAILY_CAP})`;

    if (dry) {
      results.push({ to: m.authorUsername, text: body });
    } else {
      if (!hasXCreds()) {
        return NextResponse.json(
          { ok: true, posted: false, reason: "no-x-creds" },
          { status: 200 }
        );
      }
      try {
        const { id } = await postTweet(body, { replyTo: m.id });
        results.push({ to: m.authorUsername, replyId: id, text: body });
      } catch (err) {
        console.error("[mentions-reply] post failed", m.id, err);
        continue; // don't count a failed post against the cap
      }
    }
    state.count = nextCount;
    state.users.push(m.authorId);
  }

  // Persist state + advance the watermark so we don't re-scan the same mentions.
  if (!dry) {
    await kvSet(STATE_KEY, JSON.stringify(state));
    if (newestId) await kvSet(WATERMARK_KEY, newestId);
  }

  return NextResponse.json({
    ok: true,
    dry,
    scanned: mentions.length,
    replied: results.length,
    capLeft: DAILY_CAP - state.count,
    results,
    skipped,
  });
}
