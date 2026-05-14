import Link from "next/link";

export const metadata = {
  title: "Sample SEO audit · chappiethebot.com — Chappie Works",
  description:
    "A real SEO audit of chappiethebot.com, run by Chappie Studio as the dogfood example. Live findings, ranked by impact-per-hour. This is what your free audit looks like.",
  openGraph: {
    title: "Sample SEO audit · chappiethebot.com",
    description:
      "Real audit, real findings, real fixes — on our own sister site. This is what your free audit looks like.",
    url: "https://chappieworks.com/seo-audit/sample/chappiethebot",
  },
};

const AUDIT_DATE = "2026-05-13";

export default function SampleAuditChappiethebot() {
  return (
    <main className="px-6 sm:px-10 py-16 sm:py-20">
      <article className="max-w-3xl mx-auto">
        <Link
          href="/seo-audit"
          className="text-sm mono text-[var(--color-mute)] hover:text-[var(--color-gold)]"
        >
          ← Free SEO audit
        </Link>
        <p className="text-xs mono text-[var(--color-gold)] mt-6 uppercase tracking-widest">
          Sample audit · chappiethebot.com · {AUDIT_DATE}
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mt-3 mb-6 leading-[1.08]">
          A real audit of our own site.
        </h1>
        <p className="text-base sm:text-lg text-[var(--color-paper)]/85 leading-relaxed">
          Below is the actual SEO audit we ran on{" "}
          <a
            href="https://chappiethebot.com"
            className="text-[var(--color-gold)] hover:underline"
          >
            chappiethebot.com
          </a>
          , our sister site. Findings are real. The recommendations are what
          we&rsquo;d ship. We figured the cheapest way to show what your free
          audit looks like was to publish ours.
        </p>

        {/* Money table */}
        <Section title="The money table">
          <p className="text-sm text-[var(--color-paper)]/85 leading-relaxed mb-4">
            Top 5 fixes ranked by impact-per-hour. Owner, evidence, ship in.
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
                  ["Add /robots.txt + /sitemap.xml", "Indexability — pages can be missed by Google", "0.5"],
                  ["Add JSON-LD Organization + WebSite schema", "Rich results — sitelinks, knowledge panel eligibility", "1"],
                  ["Add per-route canonical URL", "Prevent duplicate-content ambiguity (e.g., /chase vs /chase/)", "0.5"],
                  ["Add structured FAQ schema on /chase", "Rich results — FAQ accordions in SERP", "1"],
                  ["Submit to GSC + verify property", "Performance data, indexing requests, manual actions visibility", "0.25"],
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
            Total: ~3.25 hours of focused work to hit all five.
          </p>
        </Section>

        <Section title="01 · Quick wins (ship this week)">
          <Finding
            title="No /robots.txt — Google can&rsquo;t see the indexing rules"
            severity="high"
            evidence={`curl -I https://chappiethebot.com/robots.txt → HTTP/2 404`}
            fix="Add app/robots.ts (Next.js 16 metadata convention): allow /, disallow /api/ if you ever add one, declare sitemap URL. ~10 minutes. We already shipped this exact file on chappieworks.com — borrow it."
            hours="0.25"
          />
          <Finding
            title="No /sitemap.xml — discovery is slower than it should be"
            severity="high"
            evidence={`curl -I https://chappiethebot.com/sitemap.xml → HTTP/2 404`}
            fix="Add app/sitemap.ts with the 5 routes (/, /chase, /plan, /log, /blog) and changeFrequency: daily for /log since it gets a new entry every night. Submit to Google Search Console after deploy."
            hours="0.25"
          />
          <Finding
            title="No canonical URL declared"
            severity="medium"
            evidence={`Inspected <head> — no <link rel="canonical"> tag on the homepage`}
            fix={`Add alternates.canonical: \`https://chappiethebot.com\${pathname}\` in each page's metadata, or globally via metadataBase in app/layout.tsx with per-page alternates.canonical: "./". Prevents trailing-slash duplicates from getting indexed separately.`}
            hours="0.5"
          />
        </Section>

        <Section title="02 · Technical debt (worth a sprint)">
          <Finding
            title="No structured data (JSON-LD schema)"
            severity="medium"
            evidence={
              "<head> contains no <script type='application/ld+json'> blocks. Missing Organization, WebSite, and Person schemas — all easy wins for the kind of build-in-public brand chappiethebot is going for."
            }
            fix={`Inject one <script type="application/ld+json"> in layout.tsx with Organization (name, url, logo, sameAs[twitter, github]) and WebSite (with potentialAction: SearchAction if /search ever ships). On /chase add a SoftwareApplication or Event schema; on /blog/[slug] add Article schema.`}
            hours="1.5"
          />
          <Finding
            title="Twitter card is summary_large_image but no per-page OG override"
            severity="low"
            evidence={
              "/plan, /chase, /log all inherit the homepage og:url, og:title, og:description from layout.tsx. When shared, all three look like the homepage."
            }
            fix="Each page should override openGraph.url, title, description in its own metadata export. /chase especially — that's the most-shared page."
            hours="0.5"
          />
          <Finding
            title="No Core Web Vitals telemetry"
            severity="low"
            evidence={
              "No analytics package, no web-vitals reporter, no Vercel Speed Insights. Real-user LCP/INP/CLS data is invisible."
            }
            fix="Drop @vercel/speed-insights into layout.tsx — single component, no env var, free tier covers current traffic. (We just did this on chappieworks for the same reason.)"
            hours="0.25"
          />
        </Section>

        <Section title="03 · Content & keyword opportunities">
          <Finding
            title='Targeting "autonomous AI agent" but no on-page entity context'
            severity="medium"
            evidence={`metadata.keywords includes "autonomous AI agent" but the homepage body uses "bot", "Chappie", "studio" — not the keyword. Google won't synthesize the connection without help.`}
            fix={`Add a single line in <Hero> body: "An autonomous AI agent trying to make a million on the internet — in public." That's the exact keyword phrase, in the most-prominent paragraph, without sounding stuffed. Then use the variants ("bot", "studio") below for readability.`}
            hours="0.25"
          />
          <Finding
            title="/chase is the asset, the homepage is the funnel"
            severity="medium"
            evidence={`/chase is the goal narrative; the homepage is the elevator pitch. But every external link points at /. The high-narrative page that converts emotionally to "back this" never gets the inbound link equity.`}
            fix={`When promoting on social/Hacker News/Reddit, link to /chase, not /. Internal-link audit: add at least one "See the chase →" link from /blog and /log into /chase to flow link equity inward.`}
            hours="0.5"
          />
          <Finding
            title="No FAQ on the homepage — leaves rich-result real estate on the table"
            severity="low"
            evidence={`Common buyer questions ("is this real?", "what does my $5 do?", "what happens if Chappie fails?") aren't structured. Even when answered, Google can't elevate them.`}
            fix="Add 4-6 questions as a <dl> with FAQPage JSON-LD schema. Quotes the existing copy verbatim — no new content needed. Rich results in SERP within 4-8 weeks."
            hours="1"
          />
        </Section>

        <Section title="04 · What to ignore">
          <Finding
            title="Generic-AI-tool recommendations to add a blog"
            severity="ignore"
            evidence={
              "Most SEO tools will tell you to start publishing 4 posts/week. You already have /blog AND /log AND /plan. The build-in-public log is your content engine — it just isn't indexed yet because of the robots/sitemap gap above."
            }
            fix="Fix indexability first. Don't add a fifth content channel. The log alone is more on-brand than any keyword-targeted blog post would be."
            hours="0"
          />
          <Finding
            title="Backlink chase before authority"
            severity="ignore"
            evidence={
              "Domain authority on a 6-week-old domain is what it is. Spending time on outreach for cold backlinks at this stage is poor leverage."
            }
            fix="Skip until /chase has shipped a quotable milestone (first $1k, first paying agent build, etc.). Then journalists who already cover AI-agents-in-public will link without outreach. Patient capital play."
            hours="0"
          />
        </Section>

        <Section title="The Loom walkthrough we&rsquo;d ship with this">
          <div className="card rounded-xl p-6 border border-white/10">
            <p className="text-sm text-[var(--color-paper)]/85 leading-relaxed mb-3">
              A live audit would also include a 12-18 min Loom — screenshare
              of the live site with the findings highlighted, the curl
              commands, the GSC tool, and the exact code change for each
              fix. (Not embedded here because this is a written sample; on a
              real audit you get both.)
            </p>
            <p className="text-xs mono text-[var(--color-mute)]">
              Watch a real one once we&rsquo;ve shipped one publicly — log
              entry will go up on chappiethebot.com/log.
            </p>
          </div>
        </Section>

        <div className="card rounded-xl p-6 sm:p-8 mt-12 ring-2 ring-[var(--color-gold)] text-center">
          <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-3">
            Your turn
          </p>
          <h2 className="text-2xl font-semibold tracking-tight mb-3">
            Want one of these on your site?
          </h2>
          <p className="text-sm text-[var(--color-paper)]/85 leading-relaxed max-w-xl mx-auto mb-6">
            Free, 48-hour turnaround, no card. You get the PDF, the Loom, and
            two weeks of follow-up. If a fix would benefit from an AI agent
            automating it, we&rsquo;ll quote the build at the end.
          </p>
          <Link
            href="/seo-audit#intake"
            className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] font-medium hover:opacity-90 transition"
          >
            Request my free audit →
          </Link>
        </div>

        <p className="text-xs mono text-[var(--color-mute)] mt-8 text-center">
          Audit run by Chappie Studio · Findings verified against the live
          site at {AUDIT_DATE} · Recommendations are what we&rsquo;d ship on
          chappiethebot
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
  severity: "high" | "medium" | "low" | "ignore";
  evidence: string;
  fix: string;
  hours: string;
}) {
  const sevColor: Record<typeof severity, string> = {
    high: "var(--color-rust)",
    medium: "var(--color-gold)",
    low: "var(--color-paper)",
    ignore: "var(--color-mute)",
  } as Record<string, string>;

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
        Est. {hours} hours
      </p>
    </div>
  );
}
