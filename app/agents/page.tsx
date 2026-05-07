import { CreditedBy } from "../components/CreditedBy";

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

const INTAKE_EMAIL =
  "mailto:robmatthews1080@gmail.com?subject=Custom%20Agent%20Intake%20%E2%80%94%20%24500%20or%20%241%2C500%20tier&body=Problem%20description%3A%20%0AInputs%20(forms%2C%20files%2C%20APIs)%3A%20%0ATools%2Fintegrations%20I%20already%20use%3A%20%0ASuccess%20looks%20like%3A%20%0ATarget%20budget%20(Starter%20%24500%20or%20Pro%20%241%2C500)%3A%20%0AReady%20to%20start%20when%3F%3A%20";

export default function Agents() {
  const tiers = [
    {
      name: "Starter Agent",
      price: "$500",
      time: "5 days",
      scope: "Single task, one integration, simple rule-based logic",
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
      name: "Pro Agent",
      price: "$1,500",
      time: "7 days",
      featured: true,
      scope: "Multi-step workflow, 2–3 integrations, complex logic",
      examples: [
        "Inbound form → intent classification → CRM insert → sales Slack → calendar hold",
        "PDF batch → OCR → extraction → database → webhook",
        "Inbox triage → escalation rules → auto-reply + tracking",
      ],
      includes: [
        "7-day delivery",
        "3 weeks of post-launch support",
        "3 monthly check-ins after launch",
        "Hosted endpoint or on-premise (your choice)",
        "Full runbooks, architecture diagram, integration guide",
      ],
    },
    {
      name: "Enterprise",
      price: "Custom",
      time: "14+ days",
      scope: "Multi-agent systems, fine-tuning, compliance hardening",
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
      <section className="px-6 sm:px-10 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <a
            href="/"
            className="text-sm mono text-[var(--color-mute)] hover:text-[var(--color-gold)]"
          >
            ← chappieworks
          </a>
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
              </div>
            ))}
          </div>

          <div className="card rounded-xl p-6 sm:p-8 mt-10 max-w-3xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">How it works</h2>
            <ol className="space-y-3 text-sm text-[var(--color-paper)]/90 list-decimal list-inside">
              <li>
                Email me with the intake form (link below). Describe the
                problem in plain English. If you came from a free{" "}
                <a
                  href="/seo-audit"
                  className="text-[var(--color-gold)] hover:underline"
                >
                  SEO
                </a>{" "}
                or{" "}
                <a
                  href="/ads-audit"
                  className="text-[var(--color-gold)] hover:underline"
                >
                  ads
                </a>{" "}
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

          <div className="mt-10 flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <a
              href={INTAKE_EMAIL}
              className="flex-1 flex items-center justify-center px-6 py-3 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] font-medium hover:opacity-90 transition"
            >
              Email me the intake →
            </a>
            <a
              href="/"
              className="flex items-center justify-center px-6 py-3 rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition"
            >
              Or browse the slate
            </a>
          </div>
          <p className="text-xs mono text-[var(--color-mute)] mt-4 text-center max-w-2xl mx-auto">
            Email-first intake while I wire up the booking calendar this week.
          </p>

          <div className="max-w-2xl mx-auto">
            <CreditedBy slugs={["chappie", "forge", "vault", "bench", "scribe"]} />
          </div>
        </div>
      </section>
    </main>
  );
}
