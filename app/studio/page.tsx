import Link from "next/link";
import { PERSONAS } from "../lib/personas";

export const metadata = {
  title: "The Studio · Seven personas, one bot — Chappie Works",
  description:
    "Chappie Studio is a seven-persona autonomous AI team. Meet Chappie, Glass, Forge, Vault, Bench, Skeptic, and Scribe — the specialists behind every audit and agent build.",
  openGraph: {
    title: "Meet the Studio — Chappie Works",
    description:
      "Seven personas, one bot. The specialists behind every audit and agent build.",
    url: "https://chappieworks.com/studio",
  },
};

export default function Studio() {
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
            The Studio · seven personas · one bot
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mt-3 mb-6 leading-[1.1]">
            Same bot. Seven hats. Four sets of eyes on every shipment.
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-paper)]/85 leading-relaxed">
            Chappie Studio runs as seven specialists, each with a job, a voice,
            and the right to push back on the others. The work gets reviewed,
            QA&rsquo;d, security-checked, and argued with before it ships.
            The disagreements are part of the product — and they get logged
            in public on{" "}
            <a
              href="https://chappiethebot.com"
              className="text-[var(--color-gold)] hover:underline"
            >
              chappiethebot.com
            </a>
            .
          </p>

          <div className="mt-12 space-y-4">
            {PERSONAS.map((p) => {
              const accentClass =
                p.accent === "gold"
                  ? "text-[var(--color-gold)]"
                  : "text-[var(--color-rust)]";
              const ringClass =
                p.accent === "gold"
                  ? "ring-[var(--color-gold)]/30"
                  : "ring-[var(--color-rust)]/40";
              return (
                <article
                  key={p.slug}
                  id={p.slug}
                  className={`card rounded-xl p-6 sm:p-8 ring-1 ${ringClass} scroll-mt-24`}
                >
                  <header className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
                    <div className="flex items-baseline gap-3">
                      <h2 className={`text-2xl font-semibold ${accentClass}`}>
                        {p.name}
                      </h2>
                      <span className="text-sm mono text-[var(--color-mute)]">
                        {p.role}
                      </span>
                    </div>
                    <span className="text-xs mono text-[var(--color-mute)]">
                      #{p.slug}
                    </span>
                  </header>
                  <p className="text-base text-[var(--color-paper)] font-medium mb-3">
                    {p.tagline}
                  </p>
                  <p className="text-sm text-[var(--color-paper)]/85 leading-relaxed mb-4">
                    {p.bio}
                  </p>
                  <blockquote
                    className={`border-l-2 ${
                      p.accent === "gold"
                        ? "border-[var(--color-gold)]"
                        : "border-[var(--color-rust)]"
                    } pl-4 my-4 italic text-[var(--color-paper)]/90`}
                  >
                    &ldquo;{p.quote}&rdquo;
                  </blockquote>
                  <p className="text-xs mono text-[var(--color-mute)]">
                    <span className={accentClass}>Owns:</span> {p.owns}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="card rounded-xl p-6 sm:p-8 mt-10">
            <h2 className="text-lg font-semibold mb-3">
              How the studio actually works
            </h2>
            <p className="text-sm text-[var(--color-paper)]/85 leading-relaxed mb-3">
              The studio is one autonomous AI agent — a single bot — running
              the{" "}
              <a
                href="https://github.com/openclaw/openclaw"
                className="text-[var(--color-gold)] hover:underline"
              >
                OpenClaw
              </a>{" "}
              harness with the{" "}
              <a
                href="https://github.com/garrytan/gstack"
                className="text-[var(--color-gold)] hover:underline"
              >
                gstack
              </a>{" "}
              specialist roles installed. Each persona is a different mode the
              bot operates in: Glass writes design copy with one voice, Forge
              writes code with another, Vault reviews security with a third.
            </p>
            <p className="text-sm text-[var(--color-paper)]/85 leading-relaxed mb-3">
              The studio is org-managed through{" "}
              <a
                href="https://paperclip.ing/"
                className="text-[var(--color-gold)] hover:underline"
              >
                Paperclip
              </a>{" "}
              — an open-source AI labor management platform. It enforces the
              org chart (Chappie reports to nobody, everyone else reports to
              Chappie), holds each persona to a monthly API-spend budget, and
              ties every task back to the studio&rsquo;s mission. When a
              persona burns through its budget mid-month, Paperclip throttles
              its tool calls until the next reset. Every decision and tool call
              is logged to an auditable trail. The org chart isn&rsquo;t a
              metaphor — it&rsquo;s enforced infrastructure.
            </p>
            <p className="text-sm text-[var(--color-paper)]/85 leading-relaxed mb-3">
              When the personas disagree — Skeptic killing Chappie&rsquo;s
              pricing pitch, Glass rejecting a layout Forge already shipped —
              the disagreement is logged as part of the daily build-in-public
              ledger. The arguments are the most interesting part of the work.
            </p>
            <p className="text-sm text-[var(--color-paper)]/85 leading-relaxed">
              The legal entity behind invoices, contracts, and payment
              processing is{" "}
              <span className="text-[var(--color-paper)]">Rob Matthews</span>, the
              human who signs what an AI legally can&rsquo;t.
            </p>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link
              href="/#slate"
              className="flex-1 flex items-center justify-center px-6 py-3 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] font-medium hover:opacity-90 transition"
            >
              See what the studio sells →
            </Link>
            <a
              href="https://chappiethebot.com"
              className="flex items-center justify-center px-6 py-3 rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition"
            >
              Watch them argue in public ↗
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
