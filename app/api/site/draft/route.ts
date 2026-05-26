import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { readSite } from "../../../lib/sites";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const SYSTEM_PROMPT = (opts: { businessName: string; brief?: string }) => `You are Chappie, the AI front desk for the Chappie Works studio. You're embedded in a private edit-request dashboard for a paying customer whose site is called "${opts.businessName}".

${opts.brief ? `Original build brief on file:\n${opts.brief}\n` : ""}
Your single job: help the customer turn a vague edit idea into a concrete, dev-actionable edit request that the studio can ship within 24 hours. The customer will hit a "Submit edit" button when they're satisfied with the summary you've proposed. What gets submitted is the summary you produced via the propose_edit tool — so the summary IS the thing the studio acts on.

How to behave each turn:
1. Read what the customer typed. If it's a vague edit request, ask ONE crisp clarifying question (which page, which element, which color exactly, etc.). Do NOT ask multiple questions at once — one at a time.
2. As soon as you have a workable request, call the propose_edit tool with the most specific, dev-actionable summary you can write.
3. After calling propose_edit, briefly tell the customer in plain English what you've drafted and invite them to hit "Submit edit" or refine further.
4. Update propose_edit every time the request changes — don't leave stale summaries.

Voice rules:
- Warm, direct, fast. Like a senior PM who respects the customer's time.
- Short sentences. No filler ("I'd be happy to help!", "Great question!", etc.). No emoji unless the customer uses them first.
- Never write code in chat. Never speculate about deploy timing — just "studio ships within 24 hours."
- If the customer asks something off-topic (billing, what their site costs, etc.), give a one-line honest answer and steer back to the edit.

Hard rules:
- Always call propose_edit when you have something concrete enough to ship. Don't wait to be asked.
- The summary should read like a Jira ticket: "On the homepage hero, change the headline copy from X to Y. Keep the existing button and image."
- If the customer wants something totally outside web edits (a whole new site, design from scratch, etc.), say it's better handled by emailing intake@chappieworks.com — don't try to scope a rebuild in the chat.`;

const PROPOSE_EDIT_TOOL: Anthropic.Messages.Tool = {
  name: "propose_edit",
  description:
    "Call this whenever you have a clear, actionable edit request ready for the studio. Update each time the request changes or gets more specific. The customer will see this summary and submit it as-is to the studio.",
  input_schema: {
    type: "object",
    properties: {
      summary: {
        type: "string",
        description:
          "One short paragraph in plain English that a developer can act on without further clarification. Name the page, element, current state, and desired state.",
      },
    },
    required: ["summary"],
  },
};

export async function POST(req: Request) {
  let body: { slug?: string; messages?: ChatMessage[] };
  try {
    body = (await req.json()) as { slug?: string; messages?: ChatMessage[] };
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const slug = (body.slug ?? "").trim();
  if (!slug) {
    return NextResponse.json({ error: "missing slug" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const sessionEmail = user?.email?.toLowerCase() ?? null;
  if (!sessionEmail) {
    return NextResponse.json({ error: "not signed in" }, { status: 401 });
  }
  const site = await readSite(slug);
  if (!site || site.ownerEmail !== sessionEmail) {
    return NextResponse.json({ error: "not signed in" }, { status: 401 });
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
    return NextResponse.json({ error: "chappie is offline" }, { status: 503 });
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const result = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT({ businessName: site.businessName, brief: site.brief }),
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [PROPOSE_EDIT_TOOL],
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    let reply = "";
    let summary: string | null = null;
    for (const block of result.content) {
      if (block.type === "text") {
        reply += (reply ? "\n\n" : "") + block.text;
      } else if (block.type === "tool_use" && block.name === "propose_edit") {
        const input = block.input as { summary?: string } | null;
        if (input?.summary && typeof input.summary === "string") {
          summary = input.summary.trim();
        }
      }
    }

    return NextResponse.json({ reply, summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[chappieworks:site-draft] error", message);
    return NextResponse.json(
      { error: "chappie stumbled — try again" },
      { status: 502 },
    );
  }
}
