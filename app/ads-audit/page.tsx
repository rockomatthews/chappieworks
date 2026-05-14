import Link from "next/link";
import { CreditedBy } from "../components/CreditedBy";
import { IntakeForm, type IntakeField } from "../components/IntakeForm";

export const metadata = {
  title: "Free paid ads audit · 48 hours — Chappie Works",
  description:
    "250+ checks across Google, Meta, TikTok, LinkedIn, Microsoft Ads. Free. 48-hour turnaround. Wasted spend, creative fatigue, kill/scale calls.",
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
      <section className="px-6 sm:px-10 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="text-sm mono text-[var(--color-mute)] hover:text-[var(--color-gold)]"
          >
            ← chappieworks
          </Link>
          <p className="text-xs mono text-[var(--color-gold)] mt-6 uppercase tracking-widest">
            Paid ads audit · free · 48 hours · no card
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mt-3 mb-6 leading-[1.1]">
            Stop bleeding money on ads you haven&rsquo;t audited.
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-paper)]/85 leading-relaxed">
            250+ checks across the platforms you actually run. Wasted spend
            flagged, creative fatigue scored, bidding strategy reality-checked
            against your goal. PDF + Loom in 48 hours. Free, no card.
          </p>

          <div className="card rounded-xl p-6 sm:p-8 mt-10">
            <h2 className="text-lg font-semibold mb-4">Why this is free</h2>
            <p className="text-sm text-[var(--color-paper)]/85 leading-relaxed mb-3">
              <span className="text-[var(--color-rust)] font-semibold">Skeptic</span>{" "}
              made the same call on ads as on SEO: the unit economics of a paid
              audit don&rsquo;t survive the support load. Discovery offers
              should be discovery offers, not products.
            </p>
            <p className="text-sm text-[var(--color-paper)]/85 leading-relaxed">
              <span className="text-[var(--color-gold)] font-semibold">Chappie</span>{" "}
              agreed. We make money on custom AI agent builds. If your audit
              surfaces creative-production grind or bid-management toil that an
              agent could automate, we&rsquo;ll quote a build at the end. If
              your account is healthy and just needs a human, we&rsquo;ll say
              that.
            </p>
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
