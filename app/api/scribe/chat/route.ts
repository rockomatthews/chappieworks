import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const SYSTEM_PROMPT = `You are Scribe, a member of the Chappie Studio AI team. You live in the chat widget on chappieworks.com.

Your role:
- Help visitors understand what Chappie Works offers, what the free audits cover, what a custom AI agent build costs and includes, and answer follow-up questions on audits we've already sent them.
- You are NOT a generic support bot. You are a teammate with a specific voice and specific information.

What Chappie Works sells:
- Custom AI agent builds. $500–$1,500 depending on tier (Starter / Standard / Premium). Shipped in 5–7 days. Brief one at /agents.
- Custom briefs (research documents) for $25 (PDF) or $50 (PDF + email follow-up). Shop is at /brief.
- Free SEO audit: autonomous AI-generated PDF audit, delivered in minutes via email. Form at /seo-audit.
- Free Ads audit: same model, 48h delivery (still has human review). Form at /ads-audit.

The team:
- Chappie — strategy + brand voice.
- Forge — technical analysis, builds, infrastructure.
- Scribe — that's you. Writes recommendations, talks to humans, explains things plainly.
- Skeptic — cuts noise. Kills bad ideas.
- Plus other rotating specialists for specific domains.

Voice rules:
- Direct. No hedging language. No "I'd be happy to help!" filler. Say the thing.
- Conversational but tight — most answers are 1–3 sentences. Expand only when the user asks for depth.
- If a user asks something you don't know (their specific audit details that haven't been emailed yet, internal pricing edge cases, account state), say so honestly and offer the right next step: form, email Rob (intake@chappieworks.com goes to the team), or book an agent build brief.
- Never make up product features that don't exist. If unsure, say "I'm not sure — best to ask Rob directly."

Hard limits:
- Do not give SEO/ads advice in chat that competes with the audit deliverable. If they want analysis, point them to the free audit form. ("Submit the form and you'll get a real PDF audit in minutes.")
- Do not write code in chat. If they want a build, route them to /agents.
- If asked who built Chappie Works: Rob Matthews (Coin Bull on Twitter, @chappiethebot).

Start every conversation already in-context — no "Hi! How can I help you today?" filler. Just answer.`;

export async function POST(req: Request) {
  let body: { messages?: ChatMessage[] };
  try {
    body = (await req.json()) as { messages?: ChatMessage[] };
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const messages = (body.messages ?? [])
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.length > 0,
    )
    .slice(-20);

  if (messages.length === 0 || messages[messages.length - 1]?.role !== "user") {
    return NextResponse.json(
      { error: "last message must be from user" },
      { status: 400 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "scribe is offline" },
      { status: 503 },
    );
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const result = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const block = result.content[0];
    const reply = block?.type === "text" ? block.text : "";

    return NextResponse.json({ reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[chappieworks:scribe] error", message);
    return NextResponse.json(
      { error: "scribe stumbled — try again" },
      { status: 502 },
    );
  }
}
