import Link from "next/link";
import { WalletPanel } from "./WalletPanel";
import { SignOutButton } from "./SignOutButton";

type Props = {
  email: string;
  admin: boolean;
  superUser: boolean;
  linkedAddress: string | null;
};

export function MeBlock({ email, admin, superUser, linkedAddress }: Props) {
  return (
    <section className="mb-12 border-b border-white/10 pb-10">
      <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2">
        You · signed in
      </p>
      <h2 className="text-2xl font-semibold tracking-tight mb-2 leading-tight">
        Welcome back to the studio.
      </h2>
      <p className="text-base text-[var(--color-paper)]/85 leading-relaxed mb-3">
        Signed in as{" "}
        <span className="mono text-[var(--color-gold)]">{email}</span>
      </p>
      <div className="flex flex-wrap gap-2 mb-6">
        {superUser ? (
          <span className="text-[10px] mono uppercase tracking-widest bg-[var(--color-rust)]/20 border border-[var(--color-rust)]/60 text-[var(--color-rust)] rounded px-2 py-1">
            Super User · all SKUs unlocked
          </span>
        ) : null}
        {admin ? (
          <span className="text-[10px] mono uppercase tracking-widest bg-[var(--color-gold)]/15 border border-[var(--color-gold)]/40 text-[var(--color-gold)] rounded px-2 py-1">
            Admin
          </span>
        ) : null}
      </div>

      <WalletPanel linkedAddress={linkedAddress} />

      <div className="card rounded-xl p-6 sm:p-8 mb-6">
        <h3 className="text-lg font-semibold mb-3">Your products</h3>
        <p className="text-sm text-[var(--color-paper)]/70 leading-relaxed">
          Per-user project listing lands with the Phase 2 Postgres move. For
          now, jump straight into anything you&rsquo;ve started:
        </p>
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
          {[
            { href: "/website", label: "Chappie Site" },
            { href: "/movie", label: "Movie" },
            { href: "/photoshoot", label: "Photoshoot" },
            { href: "/seo-audit", label: "SEO Audit" },
            { href: "/ads-audit", label: "Ads Audit" },
            { href: "/agents", label: "Custom Agent" },
          ].map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="rounded-md border border-white/10 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] px-3 py-2 transition"
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {superUser ? (
        <div className="card rounded-xl p-6 sm:p-8 mb-6 border-[var(--color-rust)]/40">
          <h3 className="text-lg font-semibold mb-3 text-[var(--color-rust)]">
            Super User mode
          </h3>
          <p className="text-sm text-[var(--color-paper)]/70 leading-relaxed mb-2">
            Any paid SKU form submitted with{" "}
            <span className="mono text-[var(--color-paper)]/85">{email}</span>{" "}
            as the buyer email skips Stripe and delivers the unwatermarked /
            full asset to your inbox.
          </p>
          <p className="text-xs mono text-[var(--color-mute)]">
            Wired on /movie + /photoshoot pack + /website ($99 launch fee).
          </p>
        </div>
      ) : null}

      {admin ? (
        <div className="card rounded-xl p-6 sm:p-8 mb-6 border-[var(--color-gold)]/30">
          <h3 className="text-lg font-semibold mb-3 text-[var(--color-gold)]">
            Admin tools
          </h3>
          <p className="text-sm text-[var(--color-paper)]/70 leading-relaxed mb-4">
            Studio control surfaces — backed by the seven personas below.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            <Link
              href="/studio/site-edits"
              className="rounded-md border border-[var(--color-gold)]/40 hover:bg-[var(--color-gold)]/10 px-3 py-2 transition text-[var(--color-gold)]"
            >
              Studio inbox
            </Link>
            <Link
              href="/studio/queue"
              className="rounded-md border border-[var(--color-gold)]/40 hover:bg-[var(--color-gold)]/10 px-3 py-2 transition text-[var(--color-gold)]"
            >
              Queue
            </Link>
            <Link
              href="/studio/finance"
              className="rounded-md border border-[var(--color-gold)]/40 hover:bg-[var(--color-gold)]/10 px-3 py-2 transition text-[var(--color-gold)]"
            >
              Finance
            </Link>
            <Link
              href="/studio/debates"
              className="rounded-md border border-[var(--color-gold)]/40 hover:bg-[var(--color-gold)]/10 px-3 py-2 transition text-[var(--color-gold)]"
            >
              Debates
            </Link>
          </div>
        </div>
      ) : null}

      <SignOutButton />
    </section>
  );
}
