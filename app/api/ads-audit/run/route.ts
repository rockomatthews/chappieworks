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
  name: string;
  email: string;
  platforms?: string;
  access_method?: string;
  monthly_spend?: string;
  goals?: string;
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

async function generateBriefingMarkdown(s: Submission): Promise<string> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });

  const prompt = `You are writing a Pre-Audit Briefing for ${s.name} who just requested a free paid-ads audit from Chappie Works.

The full account-access audit (account screenshots, Loom walkthrough, the actual money calls) lands in 48 hours after they grant read-only access. THIS briefing is delivered in minutes, before access. Its job: prove the 250-check rigor, frame what we'll specifically look for given THEIR stated context, and give them industry-benchmarked first-pass recommendations they can act on today.

Their context:
- Platforms to audit: ${s.platforms ?? "not specified"}
- Account access method they offered: ${s.access_method ?? "not specified"}
- Monthly ad spend bucket: ${s.monthly_spend ?? "not specified"}
- What they want to fix: ${s.goals ?? "not specified"}
- Additional notes: ${s.notes ?? "none"}

## Who reads this briefing

Every briefing is read by TWO different people: the marketer or agency who actually runs the ads, AND a founder/executive who is signing the checks but doesn't read campaign manager all day. Each individual finding gets BOTH a technical detail (for the practitioner) AND a plain-English layer (for the check-signer). The technical layer keeps platform-specific jargon, exact metric thresholds, dollar math. The plain-English layer translates without dumbing down.

## Required output structure

Produce a thorough pre-audit briefing in markdown with EXACTLY four top-level sections (h1):

# 01 · What we'll look for first (your money, ranked)
4–6 platform-specific likely findings calibrated to their stated platforms + spend bucket + goals. Not generic ad-school theory — actual high-frequency findings at THEIR spend tier on THEIR platforms aimed at THEIR goal. Each finding gets:

## [Short title of the likely finding]

**For your marketer:** [The platform-specific technical detail — exact placement of the issue (e.g., "search terms report on Google PMax campaigns over $5k/mo"), the metric to check, the threshold that flags it, and the bid/budget/creative move to consider.]

**In plain English:** [1–2 sentences a non-marketer founder will understand. No jargon. Why this likely matters in dollars.]

**What to check this week:** "[A single sentence the marketer can paste into a task — imperative voice, names the exact report or column to open.]"

**Expected dollar impact:** [Range based on spend bucket and finding type. Be specific: "$1,200–$3,800/mo recovered" not "moderate impact". If you can't size it, say "Size determined by account-level data we don't have yet."]

# 02 · Tracking + attribution — the credibility check
3–5 items focused on what we'll verify the moment we get access. Conversion pixel health (client vs server), CAPI/EMQ readiness for Meta, GA4 + platform conversion source-of-truth conflicts, attribution window mismatches between platform reports and their CRM, iOS 14.5+/ATT fallout for Meta, view-through attribution settings, cross-device tracking. Same four-block format as section 01.

# 03 · Creative fatigue + diversity scoring
Platform-specific creative-side checks weighted to their stated platforms. For Meta: frequency caps, format mix (Reels vs Feed vs Stories), Advantage+ readiness, creative refresh cadence at their spend tier. For TikTok: native-first scoring, Smart+ readiness, hook-rate benchmarks. For Google: RSA asset coverage + ad strength, PMax asset group diversity, YouTube cost-per-completed-view benchmarks. For LinkedIn: Thought Leader Ads coverage, lead-gen form completion rates. Same four-block format.

# 04 · 90-day plan (start before we even have access)
Week 1, Week 2, Month 2, Month 3. Each block: ONE concrete action they can ship without our access, ranked by expected dollar impact at their spend tier. End with the explicit statement that "Weeks 4+ findings depend on the account-access audit landing in 48 hours."

## Style rules

- Direct, no hedging. Don't say "you might want to consider…" — say what to do.
- Use exact metric thresholds when calling out a finding (e.g., "frequency >3.5 over 7 days", "CTR <0.6% on search exact match", "CPM up >25% week-over-week with no audience change").
- Plain English layer must read like a normal email to a smart non-marketing founder. Not corporate-speak, not childish.
- "What to check this week" sentences must be copy-pasteable into a Notion task.
- Rank everything by dollar impact at their stated spend bucket, not by category alphabetization.
- If you're guessing because they didn't fill a field, say so explicitly ("Without seeing your search terms report I'm projecting from the spend bucket — adjust once we have access").
- No filler. No preamble. No "in conclusion." Start with "# 01 · What we'll look for first" directly.`;

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
  const date = new Date().toISOString().slice(0, 10);
  const platforms = s.platforms ?? "(platforms not specified)";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Paid Ads Pre-Audit Briefing · ${escapeHtml(s.name)}</title>
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
.context-box { background: #fcfaf5; border: 1px solid #e0d4a5; border-radius: 6px; padding: 14px 18px; margin: 0 0 20px; font-size: 0.88rem; color: #4a4a4a; line-height: 1.55; }
.context-box strong { color: #1a1a1a; }
</style>
</head>
<body>
<div class="header">
  <div class="logo">Chappie Works · Pre-Audit Briefing</div>
  <div class="title">Paid Ads Pre-Audit Briefing</div>
  <div class="meta">Prepared for ${escapeHtml(s.name)} &middot; ${date}</div>
</div>
<div class="context-box">
  <strong>What this is:</strong> a pre-audit briefing landed in minutes, before account access. It frames what we&rsquo;ll specifically look for in your accounts, calibrated to your stated platforms, spend, and goals. Industry-benchmarked, not account-specific.<br><br>
  <strong>What lands next:</strong> the full access-based audit + 15&ndash;25 min Loom walkthrough, within 48 hours of you granting read-only access. That one has the real money calls with screenshots from your actual accounts.<br><br>
  <strong>Platforms you flagged:</strong> ${escapeHtml(platforms)}
</div>
<div class="cta-banner">
  <div class="label">TL;DR for the person signing the checks</div>
  <div class="headline">The audit below is what we&rsquo;ll dig into. If you want this work automated instead of audited &mdash; bid management, creative rotation, anomaly alerting &mdash; brief a custom AI agent build at chappieworks.com/agents.</div>
  <div class="sub">Free audit is the lead. Where we actually make money is agent builds that automate the boring rotations after the audit names them. If your account doesn&rsquo;t need an agent, we&rsquo;ll say so.</div>
  <a class="cta-link" href="https://chappieworks.com/agents?ref=ads-briefing">Brief an agent build &rarr;</a>
</div>
${body}
<div class="cta-close">
  <div class="label">What happens next</div>
  <div class="headline">Three things, in order.</div>
  <div class="sub">
    <strong style="color:#f4f0e6">1. We confirm access within 24 hours.</strong> You&rsquo;ll get a reply at <a href="mailto:intake@chappieworks.com">intake@chappieworks.com</a> with the exact MCC/BM invite link or screenshare slot, depending on which method you picked.<br><br>
    <strong style="color:#f4f0e6">2. The access-based audit lands within 48 hours.</strong> Full PDF with screenshots of YOUR accounts, the actual wasted-spend money table, and a 15&ndash;25 min Loom walking through the findings live.<br><br>
    <strong style="color:#f4f0e6">3. Two weeks of follow-up Q&amp;A.</strong> Any recommendation, we&rsquo;ll dig deeper or argue with our own findings. After that, if there&rsquo;s repeated work an agent could automate, we&rsquo;ll quote a build at <a href="https://chappieworks.com/agents?ref=ads-briefing">chappieworks.com/agents</a>. If there isn&rsquo;t, we&rsquo;ll say so &mdash; no upsell pressure.
  </div>
  <a class="cta-link" href="https://chappieworks.com/agents?ref=ads-briefing">Brief an agent build &rarr;</a>
</div>
<div class="footer">
  <strong>Generated autonomously by the Chappie Studio AI team</strong> &mdash; Forge ran the technical pass, Scribe wrote the recommendations, Skeptic cut the noise.<br><br>
  Questions about anything in this briefing? Use the Scribe chat widget at <a href="https://chappieworks.com">chappieworks.com</a> &mdash; it has full context on what&rsquo;s in this PDF.<br><br>
  Need an SEO audit too? <a href="https://chappieworks.com/seo-audit">chappieworks.com/seo-audit</a> &mdash; same instant-PDF pattern, free.
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

async function sendBriefingEmail(
  s: Submission,
  pdf: Buffer,
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INTAKE_FROM_EMAIL ?? "intake@chappieworks.com";
  const bcc = process.env.INTAKE_NOTIFY_EMAIL;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY missing" };
  }

  const subject = `Your ads pre-audit briefing — what we'll dig into`;
  const text = `Hi ${s.name},

Your paid ads pre-audit briefing is attached as a PDF. It lands in minutes; the full access-based audit lands in 48 hours.

The briefing was generated autonomously by the Chappie Studio AI team — Forge ran the technical pass, Scribe wrote the recommendations, Skeptic cut the noise.

What's next:
1. We confirm account access within 24 hours (reply to this email with the MCC/BM invite or screenshare slot).
2. The full access-based audit lands within 48 hours — PDF with screenshots of YOUR accounts + 15–25 min Loom walkthrough.
3. Two weeks of follow-up Q&A.

Questions in the meantime? Use the Scribe chat widget at https://chappieworks.com — it knows your briefing and can explain any recommendation in plain English.

Want an AI agent to automate the fixes after the audit? Brief a build at https://chappieworks.com/agents.

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
        filename: `ads-pre-audit-briefing.pdf`,
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
    "[chappieworks:ads-audit] starting briefing for",
    submission.email,
    submission.platforms ?? "(no platforms)",
  );

  try {
    const md = await generateBriefingMarkdown(submission);
    if (!md || md.length < 200) {
      throw new Error("briefing markdown was empty or too short");
    }
    const html = renderHtml(submission, md);
    const pdf = await htmlToPdf(html);
    const send = await sendBriefingEmail(submission, pdf);
    if (!send.ok) {
      console.error(
        "[chappieworks:ads-audit] resend send failed",
        send.status,
        send.error,
      );
      return NextResponse.json(
        { ok: false, stage: "send", detail: send.error },
        { status: 502 },
      );
    }
    console.log(
      "[chappieworks:ads-audit] sent briefing to",
      submission.email,
      "pdf bytes",
      pdf.length,
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[chappieworks:ads-audit] failed", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
