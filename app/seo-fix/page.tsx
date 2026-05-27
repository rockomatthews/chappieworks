import Link from "next/link";
import { CreditedBy } from "../components/CreditedBy";
import { IntakeForm, type IntakeField } from "../components/IntakeForm";
import { ChatThread } from "../components/ChatThread";
import { PayWithChappieButton } from "../components/PayWithChappieButton";
import { createSupabaseServerClient } from "../lib/supabase/server";
import { isBypassEmail } from "../lib/movieEmail";

export const metadata = {
  title:
    "Chappie SEO Fix · $499 flat, every audit fix shipped in 24–48 hours — Chappie Works",
  description:
    "You got a Chappie SEO audit. Hand us GitHub access; we ship every reasonable Quick Win and Technical Debt fix from your report as a single PR within 24–48 hours. No retainer, no sprint planning. $499 flat.",
  openGraph: {
    title: "Chappie SEO Fix — $499 flat",
    description:
      "Hand us GitHub access. Every reasonable fix from your Chappie SEO audit ships in 24–48 hours as one PR.",
    url: "https://chappieworks.com/seo-fix",
  },
};

const FIX_FIELDS: IntakeField[] = [
  {
    kind: "text",
    name: "site_url",
    label: "Site URL",
    placeholder: "https://yourcompany.com",
    required: true,
  },
  {
    kind: "text",
    name: "github_repo",
    label: "GitHub repo URL (or 'will share after payment')",
    placeholder: "https://github.com/yourorg/yourrepo",
  },
  {
    kind: "select",
    name: "stack",
    label: "What's the site built on?",
    options: [
      "Next.js / React",
      "WordPress",
      "Webflow",
      "Squarespace",
      "Shopify",
      "Wix",
      "Custom / hand-rolled HTML",
      "Other / not sure",
    ],
    required: true,
  },
  {
    kind: "select",
    name: "has_audit",
    label: "Do you have a Chappie SEO audit already?",
    options: [
      "Yes — I'll forward the PDF after payment",
      "No — I'll run one first at chappieworks.com/seo-audit",
      "I have an audit from someone else (will share)",
    ],
    required: true,
  },
  {
    kind: "textarea",
    name: "priority_notes",
    label:
      "Anything to prioritize or skip? (optional — e.g. 'focus on Core Web Vitals', 'skip schema for now')",
    placeholder:
      "We care most about page speed. Schema can wait. Don't touch the blog routes.",
    rows: 4,
  },
];

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What exactly is included in the $499?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Every reasonable Quick Win item and Technical Debt item from your Chappie SEO audit. That covers: title tags, meta descriptions, alt text, schema markup, canonicals, sitemap/robots, internal linking fixes, broken-link cleanup, image-SEO basics, Core Web Vitals low-hanging fruit (lazy-loading, image dimensions, render-blocking CSS), and similar. All shipped as one PR you review before merge.",
      },
    },
    {
      "@type": "Question",
      name: "What's NOT included?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Content writing, keyword research, link building, brand-new features, design changes, and anything that requires architectural decisions (e.g., switching from WordPress to Next.js). Those are separate engagements — content writing typically needs a writer, and architectural work goes through /agents.",
      },
    },
    {
      "@type": "Question",
      name: "How does the GitHub access work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "After payment, you add chappie-bot (or a service account we'll specify) as a collaborator on your repo with write access. We branch off main, ship every fix, open a PR for your review, you approve, you merge. We don't push directly to main and we don't have access to anything beyond the repo you grant.",
      },
    },
    {
      "@type": "Question",
      name: "What if I don't have a GitHub repo? (WordPress, Squarespace, Webflow)",
      acceptedAnswer: {
        "@type": "Answer",
        text: "WordPress sites work fine — we use the WP admin / your hosting CMS access instead of GitHub. Squarespace and Wix only allow limited fixes since they restrict head/body HTML — we'll do what's possible (title tags, descriptions, alt text, basic schema) and refund the difference proportionally if the platform blocks the rest. Webflow we work directly in the Webflow Designer with publisher access.",
      },
    },
    {
      "@type": "Question",
      name: "What if the audit has way more than $499 worth of work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Then $499 is a steal for you and we'll do the work anyway as a wedge. If an audit has so much technical debt that fixing every item would take more than 16 hours of focused work, we'll flag it before starting and offer to scope a larger engagement via /agents — but for any audit produced by Chappie's standard generator, $499 covers the whole punch list.",
      },
    },
    {
      "@type": "Question",
      name: "How fast is 24–48 hours, really?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Once you've paid AND granted repo access, the clock starts. 24 hours is typical for clean Next.js or WordPress sites; 48 is the buffer for unusual stacks or larger fix lists. If we'll miss 48, we tell you upfront.",
      },
    },
  ],
};

export default async function SeoFixSku({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string; ref?: string }>;
}) {
  const { paid } = await searchParams;
  const justPaid = paid === "1";
  const stripeLink =
    process.env.NEXT_PUBLIC_STRIPE_LINK_SEO_FIX ||
    "https://buy.stripe.com/aFa6oH2lI3tH0Uhgw63oA0d";

  let superUser = false;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    superUser = isBypassEmail(user?.email);
  } catch {
    // Supabase not configured locally — render public page only.
  }

  const primaryCtaHref = superUser ? "#intake" : stripeLink;
  const primaryCtaLabel = superUser
    ? "Skip checkout — start the 24hr clock →"
    : "Pay $499 — start the 24hr clock →";

  const included = [
    "Every Quick Win item from your audit — title tags, meta descriptions, alt text",
    "Every reasonable Technical Debt item — schema, canonicals, sitemap/robots, internal links",
    "Image SEO — alt text, dimensions, lazy-loading",
    "Core Web Vitals quick wins — render-blocking CSS, image sizes, JS deferral",
    "Broken-link cleanup site-wide",
    "Single PR for your review, no direct pushes to main",
  ];

  const excluded = [
    "Content writing (blog posts, landing copy, product descriptions)",
    "Keyword strategy and research (the audit identifies; we don't strategize)",
    "Link building or outreach campaigns",
    "Design or layout changes",
    "New features or architectural work — those go through /agents",
  ];

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
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
            Chappie SEO Fix · $499 flat · 24–48 hour ship
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mt-3 mb-6 leading-[1.1]">
            Free SEO audit. $499 to ship every fix.
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-paper)]/85 leading-relaxed">
            Step one is free: an AI-generated SEO audit emailed to you in
            minutes — Core Web Vitals, schema, keyword gaps, on-page action
            list. Like what you see? Step two is $499 flat. You give the
            studio read+write access to your repo and every reasonable Quick
            Win and Technical Debt item from the audit ships as one pull
            request within 24–48 hours. You approve before merge. That&rsquo;s
            the entire deal.
          </p>

          <div className="mt-6 card rounded-xl p-4 sm:p-5 border border-[var(--color-gold)]/30 bg-[var(--color-gold)]/5">
            <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-1">
              Don&rsquo;t have an audit yet?
            </p>
            <p className="text-sm text-[var(--color-paper)]/90">
              Start free at{" "}
              <Link
                href="/seo-audit"
                className="text-[var(--color-gold)] hover:underline font-medium"
              >
                /seo-audit
              </Link>
              . AI-generated, in your inbox in minutes. Bring it back here
              when you&rsquo;re ready to ship the fixes.
            </p>
          </div>

          {justPaid ? (
            <div className="card rounded-xl p-6 sm:p-8 mt-8 ring-2 ring-[var(--color-gold)]">
              <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2">
                Payment received
              </p>
              <h2 className="text-xl sm:text-2xl font-semibold mb-3">
                Got it. Now share the repo and the audit.
              </h2>
              <p className="text-sm text-[var(--color-paper)]/85 leading-relaxed mb-4">
                Scroll down and fill in the brief — your site URL, GitHub repo
                URL, stack, and any priorities. We&rsquo;ll reply within a few
                hours with the GitHub user to add as a collaborator. The
                24–48hr ship clock starts the moment we have access.
              </p>
              <a
                href="#intake"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] font-medium hover:opacity-90 transition text-sm"
              >
                Send the repo brief →
              </a>
            </div>
          ) : (
            <>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a
                  href={primaryCtaHref}
                  className="flex-1 flex items-center justify-center px-6 py-4 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] font-medium hover:opacity-90 transition"
                >
                  {primaryCtaLabel}
                </a>
                <a
                  href="#intake"
                  className="flex-1 flex items-center justify-center px-6 py-4 rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition"
                >
                  Send a brief first (free)
                </a>
              </div>
              <div className="mt-3">
                <PayWithChappieButton usd={499} sku="seo-fix" />
              </div>
            </>
          )}

          <div className="mt-10">
            <ChatThread
              title="Why this exists — The associated team argument"
              messages={[
                {
                  speaker: "Skeptic",
                  text: "Generated SEO audits are a dime a dozen. We're charging $0 for ours and the customer still doesn't act on it. Why would they pay $499 to have us implement what we just told them to do for free?",
                },
                {
                  speaker: "Chappie",
                  text: "Because most audits get read and forgotten. The customer's brother — actual data point from this week — got our audit and said it was 'way over his head.' He has the report. He still hasn't done anything with it. The audit identified problems; it didn't translate them into someone's calendar.",
                },
                {
                  speaker: "Chappie",
                  text: "$499 is the lowest possible friction price for 'just make my SEO problems go away.' We can hit 24–48hr because the audit is the spec — Forge follows the punch list, no scoping meetings, no discovery phase. If the audit has 30 items and they're all small, that's 4 hours of focused work. If the audit has 12 items and three of them are gnarly, that's 8 hours. Either way the customer pays $499 and stops thinking about it.",
                },
              ]}
            />
          </div>

          <div className="card rounded-xl p-6 sm:p-8 mt-6">
            <h2 className="text-lg font-semibold mb-4">
              What $499 ships
            </h2>
            <ul className="space-y-2.5 text-sm text-[var(--color-paper)]/90">
              {included.map((m) => (
                <li key={m} className="flex gap-3">
                  <span aria-hidden="true" className="text-[var(--color-gold)]">
                    ▸
                  </span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs mono text-[var(--color-mute)] mt-5">
              All as one PR. You review before merge. We never push directly to
              main.
            </p>
          </div>

          <div className="card rounded-xl p-6 sm:p-8 mt-6">
            <h2 className="text-lg font-semibold mb-4">
              What $499 does NOT ship
            </h2>
            <ul className="space-y-2.5 text-sm text-[var(--color-paper)]/90">
              {excluded.map((m) => (
                <li key={m} className="flex gap-3">
                  <span aria-hidden="true" className="text-[var(--color-rust)]">
                    ✕
                  </span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs mono text-[var(--color-mute)] mt-5">
              If you need any of the above, brief a custom build at{" "}
              <Link href="/agents" className="text-[var(--color-gold)] hover:underline">
                /agents
              </Link>
              .
            </p>
          </div>

          <div className="card rounded-xl p-6 sm:p-8 mt-6">
            <h2 className="text-lg font-semibold mb-4">How it works</h2>
            <ol className="space-y-3 text-sm text-[var(--color-paper)]/90 list-decimal list-inside">
              <li>
                Get the audit first if you don&rsquo;t already have one.{" "}
                <Link href="/seo-audit" className="text-[var(--color-gold)] hover:underline">
                  chappieworks.com/seo-audit
                </Link>
                {" "}— free, ~3 minutes, PDF in your inbox.
              </li>
              <li>
                Pay the $499 launch fee via Stripe. The clock doesn&rsquo;t
                start until both payment and repo access land.
              </li>
              <li>
                Fill the brief below — site URL, repo URL, stack, anything to
                skip or prioritize.
              </li>
              <li>
                We reply with the GitHub user to add as a collaborator (or the
                equivalent for WordPress/Webflow/etc.). Once added, the 24–48hr
                ship clock starts.
              </li>
              <li>
                Forge branches off main, ships every reasonable audit item,
                opens one PR. Scribe writes the PR description and updates
                copy where needed. You review, approve, merge.
              </li>
              <li>
                Done. No retainer, no recurring. Want ongoing maintenance
                instead? See{" "}
                <Link href="/website" className="text-[var(--color-gold)] hover:underline">
                  Chappie Site
                </Link>
                .
              </li>
            </ol>
          </div>

          <div id="intake" className="mt-10 scroll-mt-20">
            <h2 className="text-2xl font-semibold tracking-tight mb-2">
              Brief the studio.
            </h2>
            <p className="text-sm text-[var(--color-mute)] mb-6">
              Two minutes. We&rsquo;ll reply within a few hours with the
              GitHub user to add and confirm the 24–48hr ship window. If
              you&rsquo;ve already paid via the button above, just include the
              email you used at checkout.
            </p>
            <IntakeForm
              formType="seo-fix"
              fields={FIX_FIELDS}
              submitLabel="Send the brief →"
            />
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/seo-audit"
              className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition text-sm"
            >
              Don&rsquo;t have an audit yet? Free one →
            </Link>
            <Link
              href="/website"
              className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition text-sm"
            >
              Want ongoing maintenance? Chappie Site →
            </Link>
          </div>

          <CreditedBy slugs={["forge", "scribe", "skeptic"]} />
        </div>
      </section>
    </main>
  );
}
