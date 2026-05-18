import Image from "next/image";
import Link from "next/link";
import { PERSONAS } from "../lib/personas";
import OrgChart from "../components/OrgChart";

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
          <div className="mt-4 flex items-center gap-2 text-xs mono text-[var(--color-mute)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            Org-managed via{" "}
            <a
              href="https://paperclip.ing"
              className="text-[var(--color-gold)] hover:underline ml-1"
            >
              Paperclip
            </a>
            <span className="ml-2">· enforced budgets · auditable task log · role permissions</span>
          </div>

          <OrgChart />

          <div className="mt-12 space-y-5">
            {PERSONAS.map((p, idx) => {
              const accentClass =
                p.accent === "gold"
                  ? "text-[var(--color-gold)]"
                  : "text-[var(--color-rust)]";
              const ringClass =
                p.accent === "gold"
                  ? "ring-[var(--color-gold)]/30"
                  : "ring-[var(--color-rust)]/40";
              const portraitRing =
                p.accent === "gold"
                  ? "0 0 0 2px var(--color-gold), 0 0 32px -8px rgba(201,164,55,0.55)"
                  : "0 0 0 2px var(--color-rust), 0 0 32px -8px rgba(139,74,43,0.6)";
              const catalogId = String(idx + 1).padStart(2, "0");
              return (
                <article
                  key={p.slug}
                  id={p.slug}
                  className={`card rounded-xl p-6 sm:p-8 ring-1 ${ringClass} scroll-mt-24`}
                >
                  <div className="flex flex-col sm:flex-row gap-5 sm:gap-7">
                    <div className="flex sm:flex-col items-center sm:items-start gap-4 sm:gap-2 sm:w-[140px] sm:flex-shrink-0">
                      <div
                        className="relative w-[110px] h-[110px] sm:w-[140px] sm:h-[140px] rounded-lg overflow-hidden flex-shrink-0 transition-transform duration-300 hover:scale-[1.03]"
                        style={{ boxShadow: portraitRing }}
                      >
                        <Image
                          src={`/profileShot${p.name}.png`}
                          alt={`${p.name} — ${p.role}`}
                          fill
                          sizes="(max-width: 640px) 110px, 140px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5 sm:items-start">
                        <span
                          className={`text-[10px] mono uppercase tracking-[0.18em] ${accentClass}`}
                        >
                          Studio · {catalogId} / 07
                        </span>
                        <span className="text-[10px] mono text-[var(--color-mute)] uppercase tracking-widest">
                          #{p.slug}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
                        <h2 className={`text-2xl font-semibold ${accentClass}`}>
                          {p.name}
                        </h2>
                        <span className="text-sm mono text-[var(--color-mute)]">
                          {p.role}
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
                    </div>
                  </div>
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
              ledger.{" "}
              <Link href="/studio/debates" className="text-[var(--color-gold)] hover:underline">
                The arguments are the most interesting part of the work.
              </Link>
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
            <Link
              href="/studio/debates"
              className="flex items-center justify-center px-6 py-3 rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition"
            >
              Read the arguments →
            </Link>
            <Link
              href="/studio/queue"
              className="flex items-center justify-center px-6 py-3 rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition"
            >
              See the queue →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
