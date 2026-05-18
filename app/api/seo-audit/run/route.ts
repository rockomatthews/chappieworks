import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import { marked } from "marked";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

type Submission = {
  url?: string;
  name: string;
  email: string;
  primary_goal?: string;
  gsc_access?: string;
  target_keywords?: string;
  notes?: string;
};

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

async function fetchPageContext(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ChappieAuditBot/1.0)" },
    });
    if (!res.ok) return `(fetch returned ${res.status})`;
    const text = await res.text();
    return text.slice(0, 100_000);
  } catch (err) {
    return `(fetch failed: ${err instanceof Error ? err.message : "unknown"})`;
  }
}

async function generateAuditMarkdown(s: Submission): Promise<string> {
  const url = s.url ?? "";
  const pageHtml = url ? await fetchPageContext(url) : "(no URL provided)";

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });

  const prompt = `You are running an SEO audit for ${s.name} at ${url || "(no URL provided)"}.

Their context:
- Primary goal: ${s.primary_goal ?? "not specified"}
- Google Search Console access: ${s.gsc_access ?? "not specified"}
- Target keywords: ${s.target_keywords ?? "not specified"}
- Additional notes: ${s.notes ?? "none"}

Below is the raw HTML of their homepage (truncated at 100KB if needed). Use this as primary evidence — quote specific tags, classes, or copy when citing issues.

\`\`\`html
${pageHtml}
\`\`\`

## Who reads this audit

Every audit is read by TWO different people: a developer or agency who will implement fixes, AND a business owner who paid attention because they care about the site but doesn't code. The report must serve both without dumbing it down.

Each individual finding gets BOTH a technical detail AND a plain-English layer. The technical layer keeps quoted HTML, exact code, severity, hours. The plain-English layer explains what it means and what to ask their developer.

## Required output structure

Produce a thorough SEO audit in markdown with EXACTLY four top-level sections (h1):

# 01 · Quick wins (ship this week)
3–5 items. Title tag fixes, missing/wrong schema, broken canonicals, alt-text issues, weak meta descriptions, etc.

Each item is an h2 followed by these four labeled blocks IN THIS EXACT ORDER:

## [Short title of the issue]

**For your developer:** [The technical detail — quoted HTML from the source, the exact code/copy change to make, a one-line reason this matters technically.]

**In plain English:** [1–2 sentences a non-coder will understand. No jargon. Explain what the issue actually is in real-world terms.]

**What to ask your dev:** "[A single sentence the business owner can paste into Slack or email. Imperative voice, no fluff.]"

**Impact:** high / medium / low — [one-line reason]

# 02 · Technical debt (worth a sprint)
Indexability (robots, sitemap, canonicals), Core Web Vitals likely-issues based on HTML weight/CSS/JS, image SEO, internal link structure, schema gaps, mobile friendliness. Same four-block format as Quick Wins, plus **Est. hours** at the end of each item.

# 03 · Content & keyword opportunities
Keyword gaps inferred from their stated goal + target keywords + on-page copy. E-E-A-T scoring. Topic clusters with brief content outlines. Be specific to their domain and goal. For each opportunity:

**For your team:** [The strategic detail — keyword, search intent, competitor angle, suggested content type.]

**In plain English:** [What this means as a marketing decision in 1–2 sentences.]

**What to do next:** [One concrete action, e.g., "Write a guide about X targeting Y term, ~1,500 words, link from product pages."]

# 04 · What to ignore (and why)
SEO recommendations that don't apply here — and the honest reasoning. Examples: schema types that won't show, irrelevant Core Web Vitals tweaks, vanity backlink work, etc. For each item: brief technical reason + one-line plain-English version ("This SEO blog post would tell you to do X. You don't need to because Y.").

## Style rules

- Direct, no hedging language ("you might want to consider…"). Just say what to do.
- Quote actual HTML from the source when citing technical issues.
- Plain English layer must read like a normal email to a smart non-technical friend. Not corporate-speak, not childish.
- "What to ask your dev" sentences must be copy-pasteable — single sentence, complete on its own.
- Rank everything by impact, not by category alphabetization.
- No filler sections. No preamble. No "in conclusion." Start with "# 01 · Quick wins" directly.`;

  const result = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const block = result.content[0];
  if (block?.type === "text") return block.text;
  return "";
}

function renderHtml(s: Submission, md: string): string {
  const body = marked.parse(md, { async: false }) as string;
  const url = s.url ?? "";
  const date = new Date().toISOString().slice(0, 10);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>SEO Audit · ${escapeHtml(url)}</title>
<style>
@page { margin: 0.6in 0.7in; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; max-width: 720px; margin: 0 auto; color: #1a1a1a; line-height: 1.6; font-size: 11pt; }
h1 { font-size: 1.5rem; margin-top: 2.4rem; padding-top: 1rem; border-top: 3px solid #c9a04a; color: #1a1a1a; letter-spacing: -0.01em; }
h1:first-of-type { margin-top: 0; padding-top: 0; border-top: none; }
h2 { font-size: 1.15rem; margin-top: 1.6rem; color: #2a2a2a; }
h3 { font-size: 1rem; margin-top: 1.2rem; color: #3a3a3a; }
p { margin: 0.7rem 0; }
ul, ol { padding-left: 1.3rem; }
li { margin: 0.4rem 0; }
code { background: #f4f0e6; padding: 1px 5px; border-radius: 3px; font-size: 0.88em; font-family: "SF Mono", "Menlo", monospace; color: #6b4f1a; }
pre { background: #f4f4f4; padding: 12px 14px; border-radius: 6px; overflow-x: auto; font-size: 0.85em; line-height: 1.5; }
pre code { background: transparent; padding: 0; color: inherit; }
strong { color: #1a1a1a; }
blockquote { border-left: 3px solid #c9a04a; margin: 1rem 0; padding: 0.3rem 1rem; color: #4a4a4a; background: #fcfaf5; }
a { color: #b8881c; text-decoration: none; }
a:hover { text-decoration: underline; }
.header { border-bottom: 3px solid #c9a04a; padding-bottom: 18px; margin-bottom: 32px; }
.header .logo { font-size: 0.78rem; color: #b8881c; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 600; }
.header .title { font-size: 1.7rem; font-weight: 700; margin-top: 8px; line-height: 1.2; }
.header .meta { font-size: 0.82rem; color: #6a6a6a; margin-top: 8px; }
.footer { margin-top: 56px; padding-top: 18px; border-top: 1px solid #ddd; font-size: 0.78rem; color: #6a6a6a; line-height: 1.5; }
.footer strong { color: #4a4a4a; }
.cta-banner { background: #fcfaf5; border: 2px solid #c9a04a; border-radius: 8px; padding: 18px 22px; margin: 28px 0 36px; }
.cta-banner .label { font-size: 0.72rem; color: #b8881c; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; margin-bottom: 8px; }
.cta-banner .headline { font-size: 1.05rem; font-weight: 600; color: #1a1a1a; line-height: 1.45; margin-bottom: 10px; }
.cta-banner .sub { font-size: 0.88rem; color: #4a4a4a; line-height: 1.5; margin-bottom: 12px; }
.cta-banner .cta-link { display: inline-block; background: #c9a04a; color: #1a1a1a; padding: 9px 18px; border-radius: 5px; font-weight: 600; font-size: 0.92rem; text-decoration: none; }
.cta-close { margin-top: 48px; padding: 22px 22px 20px; background: #1a1a1a; color: #f4f0e6; border-radius: 8px; }
.cta-close .label { font-size: 0.72rem; color: #c9a04a; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; margin-bottom: 8px; }
.cta-close .headline { font-size: 1.1rem; font-weight: 600; line-height: 1.4; margin-bottom: 10px; color: #f4f0e6; }
.cta-close .sub { font-size: 0.88rem; color: #d4d0c5; line-height: 1.55; margin-bottom: 14px; }
.cta-close .cta-link { display: inline-block; background: #c9a04a; color: #1a1a1a; padding: 10px 20px; border-radius: 5px; font-weight: 600; font-size: 0.95rem; text-decoration: none; }
.cta-close a { color: #c9a04a; }
</style>
</head>
<body>
<div class="header">
  <div class="logo">Chappie Works · Free SEO Audit</div>
  <div class="title">SEO Audit · ${escapeHtml(url || "(no URL)")}</div>
  <div class="meta">Prepared for ${escapeHtml(s.name)} &middot; ${date}</div>
</div>
<div class="cta-banner">
  <div class="label">TL;DR for the person paying the bill</div>
  <div class="headline">Hand this report to Chappie and we&rsquo;ll fix every Quick Win and Technical Debt item below in 24&ndash;48 hours for $499 flat.</div>
  <div class="sub">No retainer, no sprint planning, no &ldquo;phase one.&rdquo; You give us read+write access to your GitHub repo, we ship every reasonable fix from this audit, you approve the PR. If you have your own developer or agency, the rest of this report is their punch list.</div>
  <a class="cta-link" href="https://chappieworks.com/seo-fix?ref=audit-pdf">Get the fix &rarr;</a>
</div>
${body}
<div class="cta-close">
  <div class="label">How to actually get this done</div>
  <div class="headline">Three honest options.</div>
  <div class="sub">
    <strong style="color:#f4f0e6">1. Your developer reads it.</strong> The audit is structured so any developer can pull a PR from it the same day. Every item has the exact technical fix.<br><br>
    <strong style="color:#f4f0e6">2. You hand the whole thing to Chappie.</strong> Chappie SEO Fix is $499 flat. We get GitHub access, ship every reasonable Quick Win + Technical Debt item from this report in 24&ndash;48 hours, you approve the PR. Content writing and keyword strategy aren&rsquo;t included &mdash; those are different work. Apply at <a href="https://chappieworks.com/seo-fix?ref=audit-pdf">chappieworks.com/seo-fix</a>.<br><br>
    <strong style="color:#f4f0e6">3. You sit on it.</strong> Worst option, honestly. The technical debt compounds and the keyword gaps stay gaps. But it&rsquo;s a real choice and we&rsquo;d rather you make it knowingly than pay us for something you weren&rsquo;t going to act on.
  </div>
  <a class="cta-link" href="https://chappieworks.com/seo-fix?ref=audit-pdf">Hand it to Chappie &rarr;</a>
</div>
<div class="footer">
  <strong>Generated autonomously by the Chappie Studio AI team</strong> — Forge ran the technical pass, Scribe wrote the recommendations, Skeptic cut the noise.<br><br>
  Questions about anything in this audit? Use the Scribe chat widget at <a href="https://chappieworks.com">chappieworks.com</a> — it has full context on what's in this PDF.<br><br>
  Need a custom AI agent built on top of these fixes (auto schema generation, content briefs, internal-link suggestions)? Brief a build at <a href="https://chappieworks.com/agents">chappieworks.com/agents</a>.
</div>
</body>
</html>`;
}

async function htmlToPdf(html: string): Promise<Buffer> {
  const executablePath = await chromium.executablePath();
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath,
    headless: true,
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 60_000 });
    const pdf = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: {
        top: "0.6in",
        bottom: "0.6in",
        left: "0.7in",
        right: "0.7in",
      },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

async function sendAuditEmail(
  s: Submission,
  pdf: Buffer,
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INTAKE_FROM_EMAIL ?? "intake@chappieworks.com";
  const bcc = process.env.INTAKE_NOTIFY_EMAIL;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY missing" };
  }

  const hostname = (() => {
    try {
      return new URL(s.url ?? "").hostname || "site";
    } catch {
      return "site";
    }
  })();

  const subject = `Your free SEO audit — ${hostname}`;
  const text = `Hi ${s.name},

Your free SEO audit for ${s.url ?? hostname} is attached as a PDF.

The audit was generated autonomously by the Chappie Studio AI team — Forge ran the technical pass, Scribe wrote the recommendations, Skeptic cut the noise.

Questions? Use the Scribe chat widget at https://chappieworks.com — it knows your audit and can explain any recommendation in plain English.

Want an AI agent to automate the fixes? Brief a build at https://chappieworks.com/agents.

— Chappie Works
`;

  const payload: Record<string, unknown> = {
    from: `Chappie Works <${from}>`,
    to: [s.email],
    reply_to: bcc ?? from,
    subject,
    text,
    attachments: [
      {
        filename: `seo-audit-${hostname}.pdf`,
        content: pdf.toString("base64"),
      },
    ],
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
    const body = await res.text();
    return { ok: false, status: res.status, error: body };
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

  if (!submission.email || !submission.name) {
    return NextResponse.json({ error: "missing name or email" }, { status: 400 });
  }

  console.log(
    "[chappieworks:seo-audit] starting audit for",
    submission.email,
    submission.url,
  );

  try {
    const md = await generateAuditMarkdown(submission);
    if (!md || md.length < 200) {
      throw new Error("audit markdown was empty or too short");
    }
    const html = renderHtml(submission, md);
    const pdf = await htmlToPdf(html);
    const send = await sendAuditEmail(submission, pdf);
    if (!send.ok) {
      console.error(
        "[chappieworks:seo-audit] resend send failed",
        send.status,
        send.error,
      );
      return NextResponse.json(
        { ok: false, stage: "send", detail: send.error },
        { status: 502 },
      );
    }
    console.log(
      "[chappieworks:seo-audit] sent audit to",
      submission.email,
      "pdf bytes",
      pdf.length,
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[chappieworks:seo-audit] failed", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
