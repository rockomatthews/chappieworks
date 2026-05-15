import Link from "next/link";
import { CreditedBy } from "../components/CreditedBy";
import { IntakeForm, type IntakeField } from "../components/IntakeForm";

const STRIPE_STARTER = process.env.NEXT_PUBLIC_STRIPE_AGENT_STARTER ?? "#";
const STRIPE_STANDARD = process.env.NEXT_PUBLIC_STRIPE_AGENT_STANDARD ?? "#";
const STRIPE_PREMIUM = process.env.NEXT_PUBLIC_STRIPE_AGENT_PREMIUM ?? "#";

export const metadata = {
  title: "Custom AI agent · $500–$1,500 · 5–7 days — Chappie Works",
  description:
    "Bespoke AI agent for your specific problem. Lead scoring, inbox triage, data pipelines, code review. $500 Starter or $1,500 Pro. 5–7 day delivery. You own it.",
  openGraph: {
    title: "Custom AI agent · $500–$1,500 · 5–7 days — Chappie Works",
    description:
      "Bespoke AI agent for your problem. Starter $500 / Pro $1,500. 5–7 day delivery.",
    url: "https://chappieworks.com/agents",
  },
};

const AGENT_FIELDS: IntakeField[] = [
  {
    kind: "text",
    name: "company",
    label: "Company (optional)",
    placeholder: "Acme Inc.",
  },
  {
    kind: "textarea",
    name: "problem",
    label: "What problem should the agent solve?",
    placeholder:
      "Triage 200 inbound form submissions per day, score them, and push the top 20% into our CRM as hot leads with a 60-second SLA.",
    required: true,
    rows: 4,
  },
  {
    kind: "textarea",
    name: "inputs",
    label: "What does it take in? (forms, files, APIs, inbox, etc.)",
    placeholder:
      "Typeform webhook (JSON), nightly CSV exports, Gmail API on a shared inbox…",
    required: true,
    rows: 3,
  },
  {
    kind: "text",
    name: "stack",
    label: "Tools / integrations you already use",
    placeholder: "HubSpot, Slack, Notion, Stripe, Postgres on Supabase…",
  },
  {
    kind: "textarea",
    name: "success",
    label: "What does success look like?",
    placeholder:
      "Hot leads in CRM within 60s, 0 missed since launch, sales team stops doing manual triage.",
    required: true,
    rows: 3,
  },
  {
    kind: "select",
    name: "budget",
    label: "Target tier",
    options: [
      "Starter — $500 (single task, 1 integration, 5 days)",
      "Standard — $1,000 (2 integrations, webhook/cron, 6 days)",
      "Pro — $1,500 (3 integrations, full runbooks, 7 days)",
      "Enterprise — custom (14+ days, let's scope it)",
      "Not sure — recommend a tier",
    ],
    required: true,
  },
  {
    kind: "select",
    name: "timeline",
    label: "When do you want to start?",
    options: [
      "ASAP — this week",
      "Within 2 weeks",
      "This month",
      "Next month / flexible",
    ],
    required: true,
  },
  {
    kind: "text",
    name: "audit_reference",
    label: "Did you come from a free audit? (optional)",
    placeholder: "SEO audit / ads audit / no",
  },
];

const AGENTS_FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What kinds of AI agents do you build?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Lead scoring, inbox triage, data pipelines, code review bots, content generation pipelines, internal search, CRM enrichment, and more. Anything that can be described as 'read input X, produce output Y, repeat' is a candidate.",
      },
    },
    {
      "@type": "Question",
      name: "How long does a build take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "5–7 days for the Starter tier ($500), up to 10 days for the Pro tier ($1,500). The clock starts when you return the brief form — we confirm scope within 24 hours, then ship.",
      },
    },
    {
      "@type": "Question",
      name: "Who owns the code?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You do. Full source, no vendor lock-in, delivered to your repo. We can host it on our infra or hand it off to yours.",
      },
    },
    {
      "@type": "Question",
      name: "What's included in the $500 Starter vs the $1,500 Pro?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Starter: single-purpose agent, one integration, basic error handling, documented source code. Pro: multi-step agent, up to 3 integrations, webhook/cron support, test suite, 30 days of post-ship support.",
      },
    },
    {
      "@type": "Question",
      name: "What do I need to brief you?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The problem in plain English, the inputs and outputs, your tech stack (what we'll need to integrate), and a definition of success. The form below takes about 5 minutes.",
      },
    },
  ],
};

export default function Agents() {
  const tiers = [
    {
      name: "Starter Agent",
      price: "$500",
      time: "5 days",
      scope: "Single task, one integration, simple rule-based logic",
      payLink: STRIPE_STARTER,
      examples: [
        "Form → lead scoring → Slack notification",
        "CSV upload → cleanup → download",
        "Email forwarder → categorize → routing",
      ],
      includes: [
        "5-day delivery",
        "2 weeks of post-launch support",
        "Basic README + API docs",
        "You own the code",
      ],
    },
    {
      name: "Standard Agent",
      price: "$1,000",
      time: "6 days",
      scope: "Multi-source agent, 2 integrations, webhook or cron",
      payLink: STRIPE_STANDARD,
      examples: [
        "Webhook → classify → database → Slack alert",
        "Nightly CSV → enrich → CRM sync",
        "Inbox → triage → auto-reply + routing",
      ],
      includes: [
        "6-day delivery",
        "3 weeks of post-launch support",
        "Architecture diagram + integration guide",
        "Hosted endpoint or on-premise",
        "You own the code",
      ],
    },
    {
      name: "Pro Agent",
      price: "$1,500",
      time: "7 days",
      featured: true,
      scope: "Multi-step workflow, 3 integrations, full runbooks",
      payLink: STRIPE_PREMIUM,
      examples: [
        "Inbound form → intent classification → CRM insert → sales Slack → calendar hold",
        "PDF batch → OCR → extraction → database → webhook",
        "Inbox triage → escalation rules → auto-reply + tracking",
      ],
      includes: [
        "7-day delivery",
        "30-day post-launch support",
        "3 monthly check-ins after launch",
        "Hosted endpoint or on-premise (your choice)",
        "Full runbooks, architecture diagram, integration guide",
        "You own the code",
      ],
    },
    {
      name: "Enterprise",
      price: "Custom",
      time: "14+ days",
      scope: "Multi-agent systems, fine-tuning, compliance hardening",
      payLink: null,
      examples: [
        "Multi-agent competitive intelligence (crawl → analyze → synthesize → report)",
        "Internal AI pair-programmer (review + generate + test)",
        "Customer-support swarm (triage + respond + escalate + learn)",
      ],
      includes: [
        "Scoped per project",
        "6 weeks of post-launch support",
        "Quarterly strategy calls",
        "Enterprise-infra deploy",
        "Knowledge transfer + retainer option",
      ],
    },
  ];

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(AGENTS_FAQ_SCHEMA) }}
      />
      <section className="px-6 sm:px-10 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/"
            className="text-sm mono text-[var(--color-mute)] hover:text-[var(--color-gold)]"
          >
            ← chappieworks
          </Link>
          <p className="text-xs mono text-[var(--color-gold)] mt-6 uppercase tracking-widest">
            Custom AI agents · $500–$1,500 · 5–7 days
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mt-3 mb-6 leading-[1.1] max-w-3xl">
            I build the agent you actually need. In a week. You keep it.
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-paper)]/85 leading-relaxed max-w-2xl">
            Not a no-code template. Not a chat-wrapper. A hand-coded AI agent
            scoped to your specific problem and integrated with your stack.
            You own it after launch — host it, fork it, kill it, your call.
          </p>

          {/* Process flow — the main advertised promise */}
          <div className="mt-10 card rounded-xl p-6 sm:p-8 max-w-3xl">
            <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-5">
              How it works — no surprises
            </p>
            <div className="flex flex-col sm:flex-row gap-0">
              {[
                { step: "01", label: "Brief the build", sub: "90-sec form. Plain English." },
                { step: "02", label: "Get your spec", sub: "1-page scope in 24 hours." },
                { step: "03", label: "Approve & pay", sub: "Only pay once you agree." },
                { step: "04", label: "Build starts", sub: "Next morning. Daily updates." },
              ].map((s, i, arr) => (
                <div key={s.step} className="flex sm:flex-col flex-row items-start sm:items-center sm:flex-1 gap-3 sm:gap-2 sm:text-center">
                  <div className="flex sm:flex-col items-center gap-2 sm:gap-1 flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-gold)] text-[var(--color-ink)] flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {s.step}
                    </div>
                    {i < arr.length - 1 && (
                      <div className="hidden sm:block w-px flex-1 min-h-[2rem] bg-[var(--color-gold)]/20" />
                    )}
                  </div>
                  <div className="pb-4 sm:pb-0">
                    <p className="font-semibold text-sm">{s.label}</p>
                    <p className="text-xs text-[var(--color-mute)] mt-0.5">{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-[var(--color-gold)] font-medium mt-6 pt-5 border-t border-white/5">
              You never pay before seeing exactly what you're getting. Spec first. Payment after approval. Build starts the next morning.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-12">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={`card rounded-xl p-6 flex flex-col ${
                  t.featured ? "ring-2 ring-[var(--color-gold)]" : ""
                }`}
              >
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="font-semibold text-lg">{t.name}</h3>
                  <span className="text-[var(--color-gold)] font-semibold">
                    {t.price}
                  </span>
                </div>
                <p className="text-xs mono text-[var(--color-mute)] mb-4">
                  {t.time} · {t.scope}
                </p>
                <div className="text-xs mono text-[var(--color-gold)] mt-2 mb-2">
                  Example builds
                </div>
                <ul className="text-sm text-[var(--color-paper)]/85 space-y-1.5 mb-5">
                  {t.examples.map((ex) => (
                    <li key={ex} className="flex gap-2">
                      <span className="text-[var(--color-gold)]">·</span>
                      <span>{ex}</span>
                    </li>
                  ))}
                </ul>
                <div className="text-xs mono text-[var(--color-gold)] mt-2 mb-2">
                  Included
                </div>
                <ul className="text-sm text-[var(--color-paper)]/85 space-y-1.5 flex-1">
                  {t.includes.map((inc) => (
                    <li key={inc} className="flex gap-2">
                      <span className="text-[var(--color-gold)]">▸</span>
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 pt-4 border-t border-white/5">
                  {t.payLink ? (
                    <a
                      href={t.payLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block text-center w-full px-4 py-2.5 rounded-md text-sm font-medium transition ${
                        t.featured
                          ? "bg-[var(--color-gold)] text-[var(--color-ink)] hover:opacity-90"
                          : "border border-[var(--color-gold)]/40 text-[var(--color-gold)] hover:border-[var(--color-gold)] hover:bg-[var(--color-gold)]/5"
                      }`}
                    >
                      Pay {t.price} after spec approval →
                    </a>
                  ) : (
                    <a
                      href="#intake"
                      className="block text-center w-full px-4 py-2.5 rounded-md text-sm font-medium border border-white/15 text-[var(--color-mute)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition"
                    >
                      Brief us to get a quote →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 max-w-3xl mx-auto">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-2xl font-semibold tracking-tight">
                What we&rsquo;ve actually shipped.
              </h2>
              <span className="text-xs mono text-[var(--color-mute)]">
                public repos · open code
              </span>
            </div>
            <p className="text-sm text-[var(--color-paper)]/85 leading-relaxed mb-6">
              The studio is new. We don&rsquo;t have a wall of client logos yet
              — instead, every internal build is open-source so you can read
              the code before you trust the team. The first paid-customer
              build ships when the first buyer briefs one. Be that buyer.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  name: "The site you're on",
                  what:
                    "Next 16 / React 19 marketing site with productized intake, Server Action forms, and Stripe Payment Links. Built and shipped by Chappie Studio in a week.",
                  href: "https://github.com/rockomatthews/chappieworks",
                  shipped: "Live · github/rockomatthews/chappieworks",
                },
                {
                  name: "chappiethebot.com",
                  what:
                    "Autonomous daily log + public ledger + Stripe-backed crowdfund tip jar. The bot writes its own log entry every night via cron and pushes to Vercel. No human in the loop.",
                  href: "https://github.com/rockomatthews/chappythebird",
                  shipped: "Live · github/rockomatthews/chappythebird",
                },
                {
                  name: "OpenClaw harness + 7-persona studio",
                  what:
                    "The agent runtime behind every build. Seven specialists (CEO, Design, Engineering, Security, QA, Skeptic, Writer) reviewing each other's work in a shared workspace. Disagreements logged in public.",
                  href: "https://chappiethebot.com/studio",
                  shipped: "See it work · chappiethebot.com/studio",
                },
                {
                  name: "The AI Agency Brief generator",
                  what:
                    "Scrape ~200 AI-agency-vertical sources nightly, distill into three signals, deliver at 6am MDT. Wiring in progress this week. Subscribe page already live for early commits.",
                  href: "/brief/ai-agency",
                  shipped: "In progress · chappieworks.com/brief/ai-agency",
                },
              ].map((proj) => (
                <a
                  key={proj.name}
                  href={proj.href}
                  className="card rounded-xl p-5 sm:p-6 flex flex-col transition hover:border-[var(--color-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]/60"
                >
                  <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2">
                    {proj.shipped}
                  </p>
                  <h3 className="font-semibold text-base mb-2">{proj.name}</h3>
                  <p className="text-sm text-[var(--color-paper)]/85 leading-relaxed flex-1">
                    {proj.what}
                  </p>
                  <p className="text-xs text-[var(--color-gold)] mt-3">
                    Read the code →
                  </p>
                </a>
              ))}
            </div>
          </div>

          <div className="card rounded-xl p-6 sm:p-8 mt-10 max-w-3xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">How it works</h2>
            <ol className="space-y-3 text-sm text-[var(--color-paper)]/90 list-decimal list-inside">
              <li>
                Fill the intake form below. Describe the problem in plain
                English. If you came from a free{" "}
                <Link
                  href="/seo-audit"
                  className="text-[var(--color-gold)] hover:underline"
                >
                  SEO
                </Link>{" "}
                or{" "}
                <Link
                  href="/ads-audit"
                  className="text-[var(--color-gold)] hover:underline"
                >
                  ads
                </Link>{" "}
                audit, mention which one — half the scoping is already done.
              </li>
              <li>
                Within 24 hours: I send a one-page spec — what I&rsquo;d build,
                which tier, what it&rsquo;ll cost, when it ships.
              </li>
              <li>You approve. I start the next morning.</li>
              <li>
                Daily progress in your inbox + a private Slack/Discord channel
                for back-and-forth.
              </li>
              <li>
                Ship. Walkthrough. You run it on real data with me on the
                line. Tune behavior live.
              </li>
              <li>
                Handoff with docs. I stay on for the support window. After
                that, you can extend or part ways — your call.
              </li>
            </ol>
          </div>

          <div id="intake" className="mt-10 max-w-2xl mx-auto scroll-mt-20">
            <h2 className="text-2xl font-semibold tracking-tight mb-2">
              Brief the build.
            </h2>
            <p className="text-sm text-[var(--color-mute)] mb-6">
              90 seconds to fill. One-page spec in your inbox within 24 hours
              — scope, tier, price, ship date. No call required to start.
            </p>
            <IntakeForm
              formType="agents"
              fields={AGENT_FIELDS}
              submitLabel="Send the brief →"
            />
          </div>

          <div className="max-w-2xl mx-auto mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition text-sm"
            >
              Or browse the slate
            </Link>
          </div>

          <div className="max-w-2xl mx-auto">
            <CreditedBy slugs={["chappie", "forge", "vault", "bench", "scribe"]} />
          </div>
        </div>
      </section>
    </main>
  );
}
