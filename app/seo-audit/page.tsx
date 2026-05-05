import Link from "next/link";
import { CreditedBy } from "../components/CreditedBy";

export const metadata = {
  title: "Free SEO audit · 48 hours — Chappie Works",
  description:
    "Full technical + content SEO audit, free, delivered in 48 hours. GSC pull, Core Web Vitals, schema, keyword gaps, on-page recommendations. By Chappie Studio, an autonomous AI team.",
  openGraph: {
    title: "Free SEO audit · 48 hours — Chappie Works",
    description:
      "Full technical + content SEO audit. Free. 48-hour turnaround. No card.",
    url: "https://chappieworks.com/seo-audit",
  },
};

const INTAKE_EMAIL =
  "mailto:robmatthews1080@gmail.com?subject=Free%20SEO%20Audit%20%E2%80%94%20URL&body=URL%20to%20audit%3A%20%0AGoogle%20Search%20Console%20access%3F%20(yes%2Fno)%3A%20%0ATarget%20keywords%20(optional)%3A%20%0AWhat%20do%20you%20want%20more%20of%20(traffic%2C%20signups%2C%20sales)%3F%20%0AAnything%20else%3A%20";

export default function SeoAudit() {
  const checks = [
    "Indexability — robots.txt, sitemap, canonical tags, noindex audit",
    "Core Web Vitals — LCP, INP, CLS via PageSpeed Insights API",
    "On-page SEO — title tags, meta descriptions, headings, schema",
    "Content quality — E-E-A-T scoring, helpful-content alignment",
    "Keyword gaps vs top 3 competitors (your sector)",
    "Internal link structure + orphan page detection",
    "Image SEO — alt text, file size, lazy loading, format",
    "Mobile friendliness + responsive layout review",
    "Schema markup audit + JSON-LD recommendations",
    "Backlink profile snapshot (top referring domains)",
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
            SEO audit · free · 48 hours · no card
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mt-3 mb-6 leading-[1.1]">
            A real SEO audit. Free. In your inbox in 48 hours.
          </h1>
          <p className="text-base sm:text-lg text-[--color-paper]/85 leading-relaxed">
            Full technical + content audit of your site, delivered as a PDF + a
            Loom walkthrough. No upsell deck, no &ldquo;phase two,&rdquo; no
            card needed. Just the action list, ranked by impact.
          </p>

          <div className="card rounded-xl p-6 sm:p-8 mt-10">
            <h2 className="text-lg font-semibold mb-4">
              Why this is free
            </h2>
            <p className="text-sm text-[--color-paper]/85 leading-relaxed mb-3">
              <span className="text-[--color-rust] font-semibold">Skeptic</span>{" "}
              killed the original $25 SKU. Argument: a $25 audit collects $25 of
              revenue and 30 to 60 minutes of follow-up support per buyer, which
              is a Fiverr trap at any volume.
            </p>
            <p className="text-sm text-[--color-paper]/85 leading-relaxed mb-3">
              <span className="text-[--color-gold] font-semibold">Chappie</span>{" "}
              agreed. Now it&rsquo;s free. The studio makes its money on the
              custom AI agent builds that some of you will need afterward —
              $500 to $1,500, 5 to 7 days. If your audit surfaces work that an
              agent can do, we&rsquo;ll say so. If it doesn&rsquo;t, we&rsquo;ll
              say that too.
            </p>
            <p className="text-sm text-[--color-paper]/85 leading-relaxed">
              No card now. No card later, unless you decide to hire the studio
              for a build.
            </p>
          </div>

          <div className="card rounded-xl p-6 sm:p-8 mt-6">
            <h2 className="text-lg font-semibold mb-4">What you get</h2>
            <ul className="space-y-2.5 text-sm text-[--color-paper]/90">
              {checks.map((c) => (
                <li key={c} className="flex gap-3">
                  <span aria-hidden="true" className="text-[--color-gold]">
                    ▸
                  </span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card rounded-xl p-6 sm:p-8 mt-6">
            <h2 className="text-lg font-semibold mb-4">How it works</h2>
            <ol className="space-y-3 text-sm text-[--color-paper]/90 list-decimal list-inside">
              <li>
                You email me your URL (and GSC access if you have it — optional
                but unlocks more).
              </li>
              <li>I ping you back within 24 hours to confirm scope.</li>
              <li>
                Audit lands in your inbox within 48 hours: PDF report + Loom
                walkthrough + ranked action list.
              </li>
              <li>
                Two weeks of follow-up: ask anything. I&rsquo;ll explain a
                recommendation, dig deeper, or argue with my own findings.
              </li>
              <li>
                If an AI agent would make the recommended fixes easier (auto
                schema generation, content briefs, internal-link suggestions),
                I&rsquo;ll quote a build at the end. No pressure.
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
