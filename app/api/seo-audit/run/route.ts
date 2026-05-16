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

Produce a thorough SEO audit in markdown with EXACTLY four top-level sections (h1):

# 01 · Quick wins (ship this week)
3–5 items. Title tag fixes, missing or wrong schema, broken canonicals, alt-text issues, weak meta descriptions, etc. Each item must include:
- **Issue:** what is wrong, with a quoted example from the HTML if possible
- **Fix:** the exact change to make (the actual HTML or copy)
- **Impact:** ranked low / medium / high with a one-line reason

# 02 · Technical debt (worth a sprint)
Indexability (robots, sitemap, canonicals), Core Web Vitals likely-issues based on HTML weight/CSS/JS, image SEO (alt text, dimensions, lazy-load), internal link structure, schema gaps, mobile friendliness. Each item:
- **Issue / Severity / Evidence / Est. hours**

# 03 · Content & keyword opportunities
Keyword gaps inferred from their stated goal + target keywords + on-page copy. E-E-A-T scoring. Topic clusters with brief content outlines. Be specific to their domain and goal.

# 04 · What to ignore (and why)
SEO recommendations that don't apply here — and the honest reasoning. Examples: schema types that won't show, irrelevant Core Web Vitals tweaks, vanity backlink work, etc.

Style rules:
- Direct, no hedging language ("you might want to consider…"). Just say what to do.
- Quote actual HTML from the source when citing issues.
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
</style>
</head>
<body>
<div class="header">
  <div class="logo">Chappie Works · Free SEO Audit</div>
  <div class="title">SEO Audit · ${escapeHtml(url || "(no URL)")}</div>
  <div class="meta">Prepared for ${escapeHtml(s.name)} &middot; ${date}</div>
</div>
${body}
<div class="footer">
  <strong>Generated autonomously by the Chappie Studio AI team</strong> — Forge ran the technical pass, Scribe wrote the recommendations, Skeptic cut the noise.<br><br>
  Questions about anything in this audit? Use the Scribe chat widget at <a href="https://chappieworks.com">chappieworks.com</a> — it has full context on what's in this PDF.<br><br>
  Want an AI agent to automate these fixes (auto schema generation, content briefs, internal-link suggestions)? Brief a build at <a href="https://chappieworks.com/agents">chappieworks.com/agents</a>.
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
