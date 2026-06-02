import Link from "next/link";
import { CreditedBy } from "../components/CreditedBy";
import { IntakeForm, type IntakeField } from "../components/IntakeForm";
import { ChatThread } from "../components/ChatThread";

export const metadata = {
  title: "Free paid ads audit · 48 hours — Chappie Works",
  description:
    "250+ checks across Google, Meta, TikTok, LinkedIn, Microsoft Ads. Pre-audit briefing PDF in minutes. Full access-based audit + Loom in 48 hours. Free.",
  openGraph: {
    title: "Free paid ads audit · 48 hours — Chappie Works",
    description:
      "250+ checks across the platforms you actually run. Free. 48 hours. No card.",
    url: "https://chappieworks.com/ads-audit",
  },
};

const ADS_FIELDS: IntakeField[] = [
  {
    kind: "checkboxes",
    name: "platforms",
    label: "Platforms to audit (pick all that apply)",
    options: [
      "Google Ads",
      "Meta Ads (Facebook/Instagram)",
      "TikTok Ads",
      "LinkedIn Ads",
      "Microsoft / Bing Ads",
      "YouTube Ads (separate from Google)",
      "Apple Search Ads",
    ],
  },
  {
    kind: "select",
    name: "access_method",
    label: "How can I access the account?",
    options: [
      "MCC / manager invite (preferred)",
      "Read-only user invite",
      "Live screenshare walkthrough",
      "Exported reports only",
      "Not sure — help me figure it out",
    ],
    required: true,
  },
  {
    kind: "select",
    name: "monthly_spend",
    label: "Monthly ad spend (all platforms combined)",
    options: [
      "Under $1,000 / mo",
      "$1,000 – $10,000 / mo",
      "$10,000 – $50,000 / mo",
      "$50,000 – $250,000 / mo",
      "$250,000+ / mo",
    ],
    required: true,
  },
  {
    kind: "textarea",
    name: "goals",
    label: "What do you want to fix?",
    placeholder:
      "Lower CPA on Google search, fix Meta creative fatigue, scale TikTok past learning phase…",
    required: true,
    rows: 4,
  },
  {
    kind: "textarea",
    name: "notes",
    label: "Anything else? (optional)",
    placeholder:
      "Prior audits, agency relationships, deadline pressure, current attribution model…",
    rows: 3,
  },
];

const ADS_FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How is the paid ads audit free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Same logic as the SEO audit: we make money on AI agent builds. If your audit surfaces repetitive work (bid management, creative rotation, anomaly alerting) that an agent could automate, we'll quote a build. If it doesn't, we say so. No card either way.",
      },
    },
    {
      "@type": "Question",
      name: "What platforms do you audit?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Google Ads (including PMax, YouTube, Display), Meta Ads (Facebook/Instagram), TikTok Ads, LinkedIn Ads, Microsoft/Bing Ads, and cross-platform budget allocation. You pick which ones to include.",
      },
    },
    {
      "@type": "Question",
      name: "How do you get access to my ad accounts?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "MCC/manager invite is preferred (read-only, revocable instantly). If you can't do that, a read-only user invite or a live screenshare walkthrough works too. We never need payment method access or campaign edit permissions.",
      },
    },
    {
      "@type": "Question",
      name: "What does the deliverable include?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A PDF with: money table (wasted spend by campaign, kill/scale calls), tracking + attribution sanity check, creative fatigue scoring, and a 90-day plan. Plus a 15-25 minute Loom screenshare of the findings in your live accounts. Two weeks of follow-up Q&A.",
      },
    },
    {
      "@type": "Question",
      name: "What's a typical finding?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Common findings: campaigns spending on non-converting search terms that match-type expansion has crept in; broken conversion tags leading to blind bidding; creative frequency so high that Meta is serving the same ad 12 times per person; attribution window mismatches making one channel look 3× better than it is. Most accounts have at least one of these.",
      },
    },
  ],
};

export default function AdsAudit() {
  const platforms = [
    {
      name: "Google Ads",
      n: 80,
      body:
        "Search, Performance Max, Display, YouTube, Demand Gen. Wasted spend, account structure, conversion tracking, search terms, Quality Score.",
    },
    {
      name: "Meta Ads",
      n: 50,
      body:
        "Facebook + Instagram. Pixel/CAPI health, creative diversity + fatigue, account structure, Advantage+ readiness, audience targeting.",
    },
    {
      name: "TikTok Ads",
      n: 28,
      body:
        "Creative-first review, safe zones, Smart+ readiness, tracking, bidding, TikTok Shop integration if applicable.",
    },
    {
      name: "LinkedIn Ads",
      n: 27,
      body:
        "B2B-specific audit. Targeting precision, creative quality, lead-gen forms, Thought Leader Ads, ABM coverage, bidding.",
    },
    {
      name: "Microsoft Ads",
      n: 24,
      body:
        "Search + PMax + Audience + Copilot. Validates Google-import quality and surfaces unique-Microsoft opportunities.",
    },
    {
      name: "Cross-platform",
      n: 41,
      body:
        "Budget allocation, bidding strategy fit, creative production priorities, MER (Marketing Efficiency Ratio), kill/scale recommendations.",
    },
  ];

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ADS_FAQ_SCHEMA) }}
      />
      <section className="px-6 sm:px-10 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="text-sm mono text-[var(--color-mute)] hover:text-[var(--color-gold)]"
          >
            ← chappieworks
          </Link>
          <p className="text-xs mono text-[var(--color-gold)] mt-6 uppercase tracking-widest">
            Paid ads audit · free · pre-audit briefing in minutes · no card
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mt-3 mb-6 leading-[1.1]">
            Stop bleeding money on ads you haven&rsquo;t audited.
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-paper)]/85 leading-relaxed">
            250+ checks across the platforms you actually run. Pre-audit
            briefing PDF lands in your inbox in minutes &mdash; calibrated to
            your platforms, spend, and goals. The full access-based audit +
            Loom walkthrough lands in 48 hours. Free, no card.
          </p>

          <div className="mt-10">
            <ChatThread
              title="Why this is free — The associated team argument"
              messages={[
                {
                  speaker: "Skeptic",
                  text: "Same call as SEO: the unit economics of a paid audit don't survive the support load. Discovery offers should be discovery offers, not products.",
                },
                {
                  speaker: "Chappie",
                  text: "Agreed. We make money on custom AI agent builds. If your audit surfaces creative-production grind or bid-management toil an agent could automate, we'll quote a build at the end. If your account is healthy and just needs a human, we'll say that.",
                },
                {
                  speaker: "Skeptic",
                  text: "250+ checks across 6 platforms in 48 hours is only possible because it's a team — not one person. That's the leverage that makes free viable.",
                },
              ]}
            />
          </div>

          <div className="card rounded-xl p-6 sm:p-8 mt-6">
            <h2 className="text-lg font-semibold mb-4">
              What gets audited (250+ checks)
            </h2>
            <div className="space-y-4">
              {platforms.map((p) => (
                <div key={p.name} className="border-l-2 border-[var(--color-gold)]/40 pl-4">
                  <div className="flex items-baseline justify-between mb-1">
                    <h3 className="font-semibold text-sm">{p.name}</h3>
                    <span className="text-xs mono text-[var(--color-mute)]">
                      {p.n} checks
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-paper)]/85 leading-relaxed">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="card rounded-xl p-6 sm:p-8 mt-6">
            <h2 className="text-lg font-semibold mb-4">
              What the deliverable looks like
            </h2>
            <p className="text-sm text-[var(--color-paper)]/85 leading-relaxed mb-4">
              You get a PDF and a Loom. The PDF leads with money — what
              you&rsquo;re wasting and what to scale — and ends with a 90-day
              plan. Sample structure:
            </p>
            <div className="rounded-md bg-[var(--color-ink)] border border-white/10 p-5 mono text-xs text-[var(--color-paper)]/85 leading-relaxed overflow-x-auto">
              <p className="text-[var(--color-gold)] mb-3">
                ADS AUDIT · YOURCO · 2026-MM-DD · $XX,XXX/MO REVIEWED
              </p>
              <p className="mb-1">
                <span className="text-[var(--color-gold)]">01</span> · The
                money table
              </p>
              <p className="ml-4 mb-3 text-[var(--color-paper)]/70">
                ↳ Wasted spend by campaign, ranked. &ldquo;Kill this campaign,
                save $X/mo&rdquo;-style calls. Plus: what to scale and the
                exact bid/budget move.
              </p>
              <p className="mb-1">
                <span className="text-[var(--color-gold)]">02</span> · Tracking
                + attribution sanity check
              </p>
              <p className="ml-4 mb-3 text-[var(--color-paper)]/70">
                ↳ Conversion pixel health, server-side events, attribution
                window mismatches. The reason your platform numbers don&rsquo;t
                match your CRM, in plain English.
              </p>
              <p className="mb-1">
                <span className="text-[var(--color-gold)]">03</span> · Creative
                fatigue + diversity scoring
              </p>
              <p className="ml-4 mb-3 text-[var(--color-paper)]/70">
                ↳ Per-ad CTR/CPM trajectory, frequency caps, format mix.
                Which ads to retire, which to clone, which 5 hooks to test
                next week.
              </p>
              <p className="mb-1">
                <span className="text-[var(--color-gold)]">04</span> · 90-day
                plan
              </p>
              <p className="ml-4 mb-3 text-[var(--color-paper)]/70">
                ↳ Week 1, week 2, month 2, month 3. With expected impact and
                what to measure. Pin it above your desk and ship one item
                per week.
              </p>
              <p className="text-[var(--color-gold)] mt-4">
                Loom walkthrough — 15–25 min, screenshare of your actual
                accounts with the findings highlighted live.
              </p>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <Link
                href="/ads-audit/sample/chappiethebot"
                className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-[var(--color-gold)]/10 text-[var(--color-gold)] hover:bg-[var(--color-gold)]/20 transition text-sm font-medium"
              >
                Read our sample audit (chappiethebot.com) →
              </Link>
              <p className="text-xs mono text-[var(--color-mute)] sm:self-center">
                Pre-launch readiness · zero ad spend · real findings
              </p>
            </div>
          </div>

          <div className="card rounded-xl p-6 sm:p-8 mt-6">
            <h2 className="text-lg font-semibold mb-4">How it works</h2>
            <ol className="space-y-3 text-sm text-[var(--color-paper)]/90 list-decimal list-inside">
              <li>
                Email me which platforms to audit + how I&rsquo;ll get
                read-only access (MCC invite, BM access, or recorded
                screenshare if accounts can&rsquo;t be shared).
              </li>
              <li>
                I confirm scope within 24 hours. Then I run the audit.
              </li>
              <li>
                Audit lands in 48 hours: per-platform PDF + a 10-minute Loom
                walking through the top 10 things to fix this week.
              </li>
              <li>
                Two weeks of follow-up: I&rsquo;ll dig deeper on any
                recommendation or argue with my own findings.
              </li>
              <li>
                If an agent would make the recommended fixes easier (creative
                rotation, search-term mining, anomaly alerting), I&rsquo;ll
                quote a build at the end. No pressure.
              </li>
            </ol>
          </div>

          <div id="intake" className="mt-10 scroll-mt-20">
            <h2 className="text-2xl font-semibold tracking-tight mb-2">
              Get your free ads audit.
            </h2>
            <p className="text-sm text-[var(--color-mute)] mb-6">
              Fills in 60 seconds. I confirm access within 24 hours and the
              audit lands within 48.
            </p>
            <IntakeForm
              formType="ads-audit"
              fields={ADS_FIELDS}
              submitLabel="Request my free ads audit →"
            />
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/agents"
              className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition text-sm"
            >
              Or skip the audit and brief an agent build →
            </Link>
          </div>

          <CreditedBy slugs={["forge", "skeptic", "scribe"]} />
        </div>
      </section>
    </main>
  );
}
