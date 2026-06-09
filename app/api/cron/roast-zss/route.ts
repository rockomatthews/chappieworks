import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getUserId, getUserTweets, postTweet, hasXCreds, type XTweet } from "@/app/lib/x";
import { CHAPPIE_VOICE } from "@/app/lib/chappieVoice";

// Once-a-day: read @ZssBecker's new posts since we last looked, pick the most
// gawdy/dramatic one, and reply to it AS CHAPPIE — gentle mockery of the drama,
// never the person. Triggered by a Claude routine before 6pm. Mirrors the tweet
// cron's auth (CRON_SECRET or X_AUTOPOST_TOKEN). ?dry=1 drafts without posting.

const TARGET = "ZssBecker";
const KV_KEY = "roast:zss:lastid";

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

async function pickAndRoast(
  tweets: XTweet[]
): Promise<{ index: number; reply: string } | null> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const list = tweets
    .map((t, i) => `[${i}] ${t.text.replace(/\n+/g, " ").slice(0, 240)}`)
    .join("\n");

  const msg = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `${CHAPPIE_VOICE}

Here are recent tweets from @${TARGET} (an account that posts a lot, often gawdy and dramatic):

${list}

Pick the ONE most over-the-top, dramatic, or self-serious claim, and write a single quote-tweet AS CHAPPIE that ARGUES against it in a funny way — like a sharp op-ed one-liner or a comedian's rebuttal. Take the actual claim seriously enough to puncture it with a real point, then land the joke. Punch at the claim and the hype, never at the person — no insults about who they are, no cruelty, no slurs. Clean and witty.

Rules for the quote-tweet text:
- Max 250 characters (it sits above his embedded post). No hashtags. At most one emoji, usually none.
- Sound like Chappie: curious, blunt, a little mischievous, concrete. Argue the substance.

Respond with ONLY strict JSON, no prose: {"index": <number>, "reply": "<the quote-tweet text>"}`,
      },
    ],
  });

  const block = msg.content[0];
  const raw = block.type === "text" ? block.text : "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as { index: number; reply: string };
    if (
      typeof parsed.index !== "number" ||
      parsed.index < 0 ||
      parsed.index >= tweets.length ||
      typeof parsed.reply !== "string"
    ) {
      return null;
    }
    return { index: parsed.index, reply: parsed.reply.replace(/^["']|["']$/g, "").slice(0, 280) };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const dry = new URL(req.url).searchParams.get("dry") === "1";

  let tweets: XTweet[];
  let newestId: string | undefined;
  try {
    const userId = await getUserId(TARGET);
    const sinceId = (await kvGet(KV_KEY)) ?? undefined;
    tweets = await getUserTweets(userId, { sinceId, maxResults: 10 });
    newestId = tweets[0]?.id; // API returns newest first
  } catch (err) {
    console.error("[roast-zss] read failed", err);
    return NextResponse.json(
      { error: "read failed", detail: (err as Error).message },
      { status: 502 }
    );
  }

  if (tweets.length === 0) {
    return NextResponse.json({ ok: true, posted: false, reason: "no-new-tweets" });
  }

  let pick: { index: number; reply: string } | null;
  try {
    pick = await pickAndRoast(tweets);
  } catch (err) {
    console.error("[roast-zss] generation failed", err);
    return NextResponse.json(
      { error: "generation failed", detail: (err as Error).message },
      { status: 500 }
    );
  }
  if (!pick) {
    return NextResponse.json({ ok: true, posted: false, reason: "no-pick" });
  }

  const target = tweets[pick.index];

  if (dry) {
    return NextResponse.json({
      ok: true,
      dry: true,
      target: { id: target.id, text: target.text },
      reply: pick.reply,
      newestId,
    });
  }

  if (!hasXCreds()) {
    return NextResponse.json({ ok: true, posted: false, reason: "no-x-creds", reply: pick.reply });
  }

  try {
    // Quote-tweet: public satirical commentary on a public post — stands on our
    // own timeline (his reply settings don't apply to quotes).
    const { id } = await postTweet(pick.reply, { quoteTweetId: target.id });
    // Advance the watermark so we don't argue the same posts tomorrow.
    if (newestId) await kvSet(KV_KEY, newestId);
    console.log(`[roast-zss] quote-tweeted ${target.id} with ${id}`);
    return NextResponse.json({ ok: true, posted: true, quoteId: id, quoted: target.id, reply: pick.reply });
  } catch (err) {
    console.error("[roast-zss] post failed", err);
    return NextResponse.json(
      { error: "post failed", detail: (err as Error).message },
      { status: 502 }
    );
  }
}
