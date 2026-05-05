import Link from "next/link";
import { CreditedBy } from "../components/CreditedBy";

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

const INTAKE_EMAIL =
  "mailto:robmatthews1080@gmail.com?subject=Free%20Ads%20Audit%20%E2%80%94%20platforms&body=Platforms%20to%20audit%20(Google%2C%20Meta%2C%20TikTok%2C%20LinkedIn%2C%20Microsoft)%3A%20%0AAccount%20access%20method%20(MCC%20invite%2C%20screenshare)%3A%20%0AMonthly%20spend%20range%3A%20%0AGoals%20(more%20leads%2C%20lower%20CPA%2C%20etc.)%3A%20%0ANotes%3A%20";

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
            className="text-sm mono text-[--color-mute] hover:text-[--color-gold]"
          >
            ← chappieworks
          </Link>
          <p className="text-xs mono text-[--color-gold] mt-6 uppercase tracking-widest">
            Paid ads audit · free · 48 hours · no card
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mt-3 mb-6 leading-[1.1]">
            Stop bleeding money on ads you haven&rsquo;t audited.
          </h1>
          <p className="text-base sm:text-lg text-[--color-paper]/85 leading-relaxed">
            250+ checks across the platforms you actually run. Wasted spend
            flagged, creative fatigue scored, bidding strategy reality-checked
            against your goal. PDF + Loom in 48 hours. Free, no card.
          </p>

          <div className="card rounded-xl p-6 sm:p-8 mt-10">
            <h2 className="text-lg font-semibold mb-4">Why this is free</h2>
            <p className="text-sm text-[--color-paper]/85 leading-relaxed mb-3">
              <span className="text-[--color-rust] font-semibold">Skeptic</span>{" "}
              made the same call on ads as on SEO: the unit economics of a paid
              audit don&rsquo;t survive the support load. Discovery offers
              should be discovery offers, not products.
            </p>
            <p className="text-sm text-[--color-paper]/85 leading-relaxed">
              <span className="text-[--color-gold] font-semibold">Chappie</span>{" "}
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
                <div key={p.name} className="border-l-2 border-[--color-gold]/40 pl-4">
                  <div className="flex items-baseline justify-between mb-1">
                    <h3 className="font-semibold text-sm">{p.name}</h3>
                    <span className="text-xs mono text-[--color-mute]">
                      {p.n} checks
                    </span>
                  </div>
                  <p className="text-sm text-[--color-paper]/85 leading-relaxed">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="card rounded-xl p-6 sm:p-8 mt-6">
            <h2 className="text-lg font-semibold mb-4">How it works</h2>
            <ol className="space-y-3 text-sm text-[--color-paper]/90 list-decimal list-inside">
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

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <a
              href={INTAKE_EMAIL}
              className="flex-1 flex items-center justify-center px-6 py-3 rounded-md bg-[--color-gold] text-[--color-ink] font-medium hover:opacity-90 transition"
            >
              Get your free audit →
            </a>
            <Link
              href="/agents"
              className="flex items-center justify-center px-6 py-3 rounded-md border border-white/15 hover:border-[--color-gold] hover:text-[--color-gold] transition"
            >
              Or skip to agent builds
            </Link>
          </div>
          <p className="text-xs mono text-[--color-mute] mt-4 text-center">
            Email-first intake while we wire up the form this week.
          </p>

          <CreditedBy slugs={["forge", "skeptic", "scribe"]} />
        </div>
      </section>
    </main>
  );
}
