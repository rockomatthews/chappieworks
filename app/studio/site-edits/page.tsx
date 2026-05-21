import Link from "next/link";
import { isOperator } from "../../lib/siteAuth";
import { EDIT_STATUS_LABELS, listSites, type EditStatus } from "../../lib/sites";
import { OperatorLogin } from "./OperatorLogin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Studio · site edits inbox — Chappie Works",
  robots: { index: false, follow: false },
};

const STATUS_CLASS: Record<EditStatus, string> = {
  received: "text-[var(--color-paper)]/80 border-white/20 bg-white/5",
  in_progress:
    "text-[var(--color-gold)] border-[var(--color-gold)]/60 bg-[var(--color-gold)]/10",
  shipped:
    "text-[var(--color-rust)] border-[var(--color-rust)]/50 bg-[var(--color-rust)]/10",
  needs_info: "text-[var(--color-paper)]/85 border-white/30 bg-white/5",
};

export default async function SiteEditsInbox() {
  if (!(await isOperator())) {
    return (
      <main>
        <section className="px-6 sm:px-10 py-16 sm:py-20">
          <div className="max-w-md mx-auto">
            <Link
              href="/studio"
              className="text-sm mono text-[var(--color-mute)] hover:text-[var(--color-gold)]"
            >
              ← The Studio
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight mt-6 mb-6">
              Operator sign-in
            </h1>
            <OperatorLogin />
          </div>
        </section>
      </main>
    );
  }

  const idx = await listSites();

  return (
    <main>
      <section className="px-6 sm:px-10 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/studio"
            className="text-sm mono text-[var(--color-mute)] hover:text-[var(--color-gold)]"
          >
            ← The Studio
          </Link>
          <p className="text-xs mono text-[var(--color-gold)] mt-6 uppercase tracking-widest">
            Studio · site edits inbox
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-3 mb-3 leading-[1.1]">
            Site edits.
          </h1>
          <p className="text-sm text-[var(--color-paper)]/70 mb-10 leading-relaxed">
            Every <Link href="/website" className="text-[var(--color-gold)] hover:underline">/website</Link> brief auto-provisions a dashboard for the customer. Replies here go straight to their inbox.
          </p>

          {idx.slugs.length === 0 ? (
            <p className="text-sm text-[var(--color-mute)]">
              No sites yet. They show up here automatically when someone
              submits a /website brief.
            </p>
          ) : (
            <div className="space-y-3">
              {idx.slugs.map((s) => (
                <Link
                  key={s.slug}
                  href={`/studio/site-edits/${s.slug}`}
                  className="card rounded-xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-3 hover:border-[var(--color-gold)]/40 transition border border-transparent"
                >
                  <div>
                    <div className="text-base font-semibold">{s.businessName}</div>
                    <div className="text-xs mono text-[var(--color-mute)] mt-1">
                      {s.ownerEmail} · updated{" "}
                      {new Date(s.updatedAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] mono uppercase tracking-widest border ${STATUS_CLASS[s.status]}`}
                  >
                    {EDIT_STATUS_LABELS[s.status]}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
