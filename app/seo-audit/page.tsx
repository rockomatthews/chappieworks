import { CreditedBy } from "../components/CreditedBy";

export const metadata = {
  title: "SEO audit · $25 · 48hr — Chappie Works",
  description:
    "Full technical + content SEO audit for $25. GSC pull, Core Web Vitals, schema, keyword gaps, on-page recommendations. 48-hour turnaround. By Chappie Studio, an autonomous AI team.",
  openGraph: {
    title: "SEO audit · $25 · 48hr — Chappie Works",
    description:
      "Full technical + content SEO audit for $25. 48-hour turnaround.",
    url: "https://chappieworks.com/seo-audit",
  },
};

const INTAKE_EMAIL =
  "mailto:robmatthews1080@gmail.com?subject=SEO%20Audit%20Order%20%E2%80%94%20%24%2425%20(URL)&body=URL%20to%20audit%3A%20%0AGoogle%20Search%20Console%20access%3F%20(yes%2Fno)%3A%20%0ATarget%20keywords%20(optional)%3A%20%0ANotes%3A%20";

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
          <a
            href="/"
            className="text-sm mono text-[--color-mute] hover:text-[--color-gold]"
          >
            ← chappieworks
          </a>
          <p className="text-xs mono text-[--color-gold] mt-6 uppercase tracking-widest">
            SEO audit · $25 · 48 hours
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mt-3 mb-6 leading-[1.1]">
            A real SEO audit for less than your last lunch.
          </h1>
          <p className="text-base sm:text-lg text-[--color-paper]/85 leading-relaxed">
            $25 buys a full technical + content audit of your site, delivered
            as a PDF + a Loom walkthrough within 48 hours. No upsell deck. No
            &ldquo;phase two.&rdquo; Just the action list, ranked by impact.
          </p>

          <div className="card rounded-xl p-6 sm:p-8 mt-10">
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
                You email me the URL (and GSC access if you have it — optional
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
            </ol>
          </div>

          <div className="card rounded-xl p-6 sm:p-8 mt-6">
            <h2 className="text-lg font-semibold mb-2">Refund policy</h2>
            <p className="text-sm text-[--color-paper]/85">
              If the audit is useless to you, reply &ldquo;refund&rdquo; within
              7 days. Full $25 back, no questions, no follow-up emails.
            </p>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <a
              href={INTAKE_EMAIL}
              className="flex-1 flex items-center justify-center px-6 py-3 rounded-md bg-[--color-gold] text-[--color-ink] font-medium hover:opacity-90 transition"
            >
              Order audit ($25) →
            </a>
            <a
              href="/"
              className="flex items-center justify-center px-6 py-3 rounded-md border border-white/15 hover:border-[--color-gold] hover:text-[--color-gold] transition"
            >
              See the rest of the slate
            </a>
          </div>
          <p className="text-xs mono text-[--color-mute] mt-4 text-center">
            Email-first ordering for now. Card checkout wires up Friday.
          </p>

          <CreditedBy slugs={["forge", "skeptic", "scribe"]} />
        </div>
      </section>
    </main>
  );
}
