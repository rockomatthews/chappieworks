import Link from "next/link";

export const metadata = {
  title: "Sample ads audit · chappiethebot.com — Chappie Works",
  description:
    "A real paid-ads readiness audit of chappiethebot.com — our sister site. Zero ad spend today, but here's exactly what to wire before running the first dollar. This is what your free audit looks like.",
  openGraph: {
    title: "Sample ads audit · chappiethebot.com",
    description:
      "Real audit, real findings — on our own site. Zero running ads; here's what to set up before spending the first dollar.",
    url: "https://chappieworks.com/ads-audit/sample/chappiethebot",
  },
};

const AUDIT_DATE = "2026-05-13";

export default function SampleAdsAuditChappiethebot() {
  return (
    <main className="px-6 sm:px-10 py-16 sm:py-20">
      <article className="max-w-3xl mx-auto">
        <Link
          href="/ads-audit"
          className="text-sm mono text-[var(--color-mute)] hover:text-[var(--color-gold)]"
        >
          ← Free ads audit
        </Link>
        <p className="text-xs mono text-[var(--color-gold)] mt-6 uppercase tracking-widest">
          Sample audit · chappiethebot.com · {AUDIT_DATE}
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mt-3 mb-6 leading-[1.08]">
          Auditing our own ads setup before spending a dollar.
        </h1>
        <p className="text-base sm:text-lg text-[var(--color-paper)]/85 leading-relaxed">
          chappiethebot.com runs zero paid ads today. But we audited the site
          as if it were about to launch a $500/month Google Ads + Meta campaign.
          What follows is exactly what we found and what we&rsquo;d fix before
          spending the first dollar. This is what your free audit looks like.
        </p>

        <Section title="The money table">
          <p className="text-sm text-[var(--color-paper)]/85 leading-relaxed mb-4">
            Top 5 fixes ranked by wasted-spend-prevented per hour of setup work.
          </p>
          <div className="card rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-gold)]/10 mono text-xs uppercase tracking-widest text-[var(--color-gold)]">
                <tr>
                  <th className="text-left p-3">Fix</th>
                  <th className="text-left p-3 hidden sm:table-cell">Impact</th>
                  <th className="text-left p-3">Hours</th>
                </tr>
              </thead>
              <tbody className="text-[var(--color-paper)]/90">
                {[
                  ["Install Google Tag Manager", "Foundation layer — nothing else tracks without it", "0.5"],
                  ["Wire Google Ads conversion tag via GTM", "Without it, Google optimizes for clicks, not buyers", "0.5"],
                  ["Add Meta Pixel + Conversions API", "Attribution for any Instagram/Facebook traffic; CAPI preserves it past iOS 14 cutoff", "1"],
                  ["Create Google Ads remarketing audience from site visitors", "Visitors are warm — retargeting them costs 3-5× less per conversion than cold traffic", "0.25"],
                  ["Enable auto-tagging in Google Ads + verify UTMs in GA4", "Without this, all Google Ads traffic shows as (direct) in analytics — blind bidding", "0.25"],
                ].map((row, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="p-3">{row[0]}</td>
                    <td className="p-3 text-xs text-[var(--color-paper)]/70 hidden sm:table-cell">
                      {row[1]}
                    </td>
                    <td className="p-3 mono text-xs text-[var(--color-gold)]">
                      {row[2]}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs mono text-[var(--color-mute)] mt-3">
            Total: ~2.5 hours of setup before the first dollar is spent.
          </p>
        </Section>

        <Section title="01 · Tracking infrastructure (fix before first spend)">
          <Finding
            title="No Google Tag Manager container on the site"
            severity="critical"
            evidence="Inspected page source — no GTM snippet in <head> or <body>. Every tracking tag (Google Ads, GA4, Meta Pixel, LinkedIn Insight, etc.) would have to be hardcoded manually into the codebase and redeployed to change."
            fix="Create a GTM account (free), get the two-snippet install code, add to app/layout.tsx: snippet 1 in <head>, snippet 2 after <body>. Confirm in GTM Preview mode. From here, all other tags are deployed from the GTM UI — no code deploys needed."
            hours="0.5"
          />
          <Finding
            title="No conversion tracking tag"
            severity="critical"
            evidence="With no GTM container, there are no Google Ads conversion tags. Running Google Ads without conversion tracking means the algorithm optimizes for clicks — not for the actions that make money (tip jar transactions, agent intake submissions). Expected ROAS collapse: 40-60%."
            fix="After GTM is installed: in Google Ads, go to Tools → Conversions → + New conversion action → Website. Create two goals: (1) Tip/back transaction (fire on Stripe redirect success), (2) Intake form submission (fire on the inline success state). Deploy both via GTM. Set the primary conversion goal in campaign settings."
            hours="0.5"
          />
          <Finding
            title="No Meta Pixel or Conversions API"
            severity="high"
            evidence="No fbq() call in page source. No _fbq cookie. If we ever run Meta ads (Instagram, Facebook), iOS 14+ App Tracking Transparency means browser-side pixel data is ~60% incomplete. Conversions API (CAPI) fills the gap by sending server-side events."
            fix="Create a Meta Business Manager account + Pixel. Deploy pixel via GTM (no code change). For CAPI: add a server-side route at app/api/meta/conversion/route.ts that fires on intake submission and Stripe success — POST to graph.facebook.com/v17.0/{pixel_id}/events with event_name, event_time, user_data (hashed email). CAPI + pixel together = 95%+ signal recovery."
            hours="1"
          />
        </Section>

        <Section title="02 · Account structure (set up before campaign launch)">
          <Finding
            title="No Google Ads account exists yet"
            severity="medium"
            evidence="No Google Ads customer ID found (would appear in UTM params on paid traffic). Clean-slate setup."
            fix="Create Google Ads account. Enable auto-tagging (default on). Set conversion goals (from above) as campaign-level primary conversions. For a build-in-public brand with a clear niche (autonomous AI), start with one Search campaign — exact/phrase match on 'AI agent builder', 'custom AI agent', 'hire AI developer'. Daily budget $15-20. Run for 2 weeks before touching anything."
            hours="1"
          />
          <Finding
            title="No UTM parameter discipline in any existing links"
            severity="medium"
            evidence="Links in the chappiethebot.com header (chappieworks.com/works ↗) have no UTM tags. When a visitor clicks through from chappiethebot to chappieworks, the referral source drops — the chappieworks analytics will show it as (direct) instead of (referral / chappiethebot.com)."
            fix="Add ?utm_source=chappiethebot&utm_medium=site&utm_campaign=nav to the chappieworks.com header link on chappiethebot. Low-cost, high-value: correctly attributes any cross-site conversion to the referring content. Same pattern for any social bio links."
            hours="0.25"
          />
          <Finding
            title="Landing pages not conversion-optimized for paid traffic"
            severity="medium"
            evidence="The homepage is a great organic/direct page. But paid traffic needs a single action above the fold — the current homepage has 3 competing CTAs (tip jar, chappieworks link, Telegram CTA) before scroll. Paid traffic sent here will have a high bounce rate."
            fix="Don't fix the homepage — create a dedicated landing page at /lp/back-chappie for paid traffic. Single headline. Single CTA (tip jar). Social proof (tip count). No nav. No footer links. This is the standard SEM/paid-social pattern; Quality Score on your Google Ads will also improve if the ad → landing page → conversion are thematically tight."
            hours="3"
          />
        </Section>

        <Section title="03 · Audience and targeting setup">
          <Finding
            title="No remarketing audiences defined"
            severity="medium"
            evidence="No Google Ads remarketing tag, no custom audience lists in Meta. Site visitors who don't convert on the first visit (95%+ of them) are currently invisible to retargeting. Retargeting CPCs are typically 3-5× cheaper than cold prospecting."
            fix="Once GTM is installed: add a Google Ads remarketing tag globally. Create audience lists in Google Ads: (a) All visitors — 30 days, (b) Visited /chase — 30 days, (c) Did NOT convert — custom combination. For Meta: create Website Custom Audiences from the pixel (all visitors, /chase visitors). These lists build passively — start retargeting campaigns once lists hit 1,000+ users."
            hours="0.5"
          />
          <Finding
            title="No lookalike audience foundation"
            severity="low"
            evidence="Lookalike audiences (Meta) and Customer Match (Google) require a seed list of existing converters. With zero transactions logged, there's nothing to build a lookalike from."
            fix="Not urgent — fix it when tip jar has 50+ transactions. At that point: export Stripe customer emails, upload to Meta as a Custom Audience, create a 1% lookalike in tier-1 English-speaking countries. This is the highest-ROI cold prospecting mechanism available. Log this as a 3-month reminder."
            hours="0"
          />
        </Section>

        <Section title="04 · What to skip (at this stage)">
          <Finding
            title="LinkedIn Ads"
            severity="ignore"
            evidence="LinkedIn CPCs average $8-15 for tech/AI audiences. Minimum effective daily budget is $50-100. For a pre-revenue brand with a $500/month ads budget, LinkedIn is a fast way to burn it with zero measurable ROI. The audience that backs a build-in-public AI bot isn't on LinkedIn — they're on HN, Reddit, and Twitter/X."
            fix="Skip entirely until monthly revenue crosses $5k and you have a clear B2B sales motion. Then reconsider."
            hours="0"
          />
          <Finding
            title="TikTok Ads"
            severity="ignore"
            evidence="TikTok Ads Manager has a $20/day minimum. Creative requirements are video-first. Producing fresh short-form video for an autonomous-AI-bot audience is expensive relative to the expected return at this stage."
            fix="Skip until there's an organic TikTok presence to test content fit first. Organic TikTok costs only time; if a format goes viral, then run the winning content as an ad."
            hours="0"
          />
          <Finding
            title="Brand Search campaigns"
            severity="ignore"
            evidence="No competitor is bidding on 'chappiethebot' today. Branded search campaigns are a pure tax — you're paying to capture traffic that would click your organic result for free."
            fix="Skip branded campaigns until a competitor starts bidding on your brand name. Monitor monthly via the Google Ads Auction Insights report. When you see competition, then add the defensive branded campaign."
            hours="0"
          />
        </Section>

        <Section title="What the deliverable looks like on a live account">
          <div className="card rounded-xl p-6 border border-white/10">
            <p className="text-sm text-[var(--color-paper)]/85 leading-relaxed mb-3">
              This sample shows the pre-flight audit for a zero-spend account.
              For a live account, the deliverable also includes:
            </p>
            <ul className="space-y-2 text-sm text-[var(--color-paper)]/80">
              {[
                "Wasted spend analysis — campaigns/ad groups spending money on zero-conversion queries",
                "Search term report review — n-gram analysis of what's actually converting vs. what's just getting clicks",
                "Quality Score breakdown — which keywords are dragging up CPCs and why",
                "Creative fatigue check — ad frequency, CTR trend over time, which creative variants are exhausted",
                "Audience overlap report — are your retargeting and prospecting audiences cannibalizing each other?",
                "Attribution model comparison — last-click vs. data-driven, how much credit each channel gets",
                "Kill/scale call — specific campaigns/ad sets to pause this week and which to 2× budget",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="text-[var(--color-gold)] mt-0.5">▸</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs mono text-[var(--color-mute)] mt-4">
              Plus the Loom walkthrough — screenshare of the live account with
              findings highlighted. The written report + Loom together, 48 hours.
            </p>
          </div>
        </Section>

        <div className="card rounded-xl p-6 sm:p-8 mt-12 ring-2 ring-[var(--color-gold)] text-center">
          <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-3">
            Your turn
          </p>
          <h2 className="text-2xl font-semibold tracking-tight mb-3">
            Want one of these on your account?
          </h2>
          <p className="text-sm text-[var(--color-paper)]/85 leading-relaxed max-w-xl mx-auto mb-6">
            Free, 48-hour turnaround, no card. You get the PDF, the Loom, and
            two weeks of follow-up. If a fix would benefit from an AI agent
            automating it (bid management, creative refresh, budget pacing),
            we&rsquo;ll quote the build at the end.
          </p>
          <Link
            href="/ads-audit#intake"
            className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] font-medium hover:opacity-90 transition"
          >
            Request my free audit →
          </Link>
        </div>

        <p className="text-xs mono text-[var(--color-mute)] mt-8 text-center">
          Audit run by Chappie Studio · Pre-launch readiness check against the
          live site at {AUDIT_DATE} · Recommendations assume a $500–$1,500/month
          starting ad budget
        </p>
      </article>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <h2 className="text-xl sm:text-2xl font-semibold tracking-tight mb-5 text-[var(--color-paper)]">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Finding({
  title,
  severity,
  evidence,
  fix,
  hours,
}: {
  title: string;
  severity: "critical" | "high" | "medium" | "low" | "ignore";
  evidence: string;
  fix: string;
  hours: string;
}) {
  const sevColor: Record<string, string> = {
    critical: "var(--color-rust)",
    high: "var(--color-rust)",
    medium: "var(--color-gold)",
    low: "var(--color-paper)",
    ignore: "var(--color-mute)",
  };

  return (
    <div className="card rounded-xl p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h3 className="font-semibold text-base">{title}</h3>
        <span
          className="text-xs mono uppercase tracking-widest whitespace-nowrap"
          style={{ color: sevColor[severity] }}
        >
          {severity}
        </span>
      </div>
      <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-1">
        Evidence
      </p>
      <p className="text-sm text-[var(--color-paper)]/85 leading-relaxed mb-3 break-words">
        {evidence}
      </p>
      <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-1">
        Fix
      </p>
      <p className="text-sm text-[var(--color-paper)]/85 leading-relaxed mb-3">
        {fix}
      </p>
      <p className="text-xs mono text-[var(--color-mute)]">
        Est. {hours === "0" ? "skip" : `${hours} hours`}
      </p>
    </div>
  );
}
