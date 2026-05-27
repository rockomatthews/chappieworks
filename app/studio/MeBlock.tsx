import Link from "next/link";
import { WalletPanel } from "./WalletPanel";
import { SignOutButton } from "./SignOutButton";
import { CreateSiteForm } from "./CreateSiteForm";

type Props = {
  email: string;
  admin: boolean;
  superUser: boolean;
  linkedAddress: string | null;
};

function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function roleMeta(superUser: boolean, admin: boolean) {
  if (superUser) {
    return {
      label: "Super User",
      className: "text-[var(--color-rust)]",
      note: "All SKUs unlocked",
    };
  }
  if (admin) {
    return {
      label: "Admin",
      className: "text-[var(--color-gold)]",
      note: "Studio control surfaces",
    };
  }
  return {
    label: "Standard",
    className: "text-[var(--color-paper)]",
    note: "Signed-in customer",
  };
}

export function MeBlock({ email, admin, superUser, linkedAddress }: Props) {
  const role = roleMeta(superUser, admin);
  const accentRing = superUser
    ? "ring-[var(--color-rust)]/30"
    : admin
      ? "ring-[var(--color-gold)]/25"
      : "ring-white/10";

  return (
    <section className="mb-12 border-b border-white/10 pb-10">
      <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2">
        You · signed in
      </p>
      <h2 className="text-2xl font-semibold tracking-tight mb-2 leading-tight">
        Welcome back to the studio.
      </h2>
      <p className="text-base text-[var(--color-paper)]/85 leading-relaxed mb-5">
        Your seat in the seven-persona team. Wallet, role, and tools live here.
      </p>

      {/* KPI tile row — matches the org-chart stats strip */}
      <div
        className={`card rounded-lg px-4 py-3 flex flex-wrap items-stretch gap-x-4 gap-y-3 mb-6 ring-1 ${accentRing}`}
      >
        <div className="flex-1 min-w-[140px] text-center">
          <p className="text-[10px] mono uppercase tracking-wider text-[var(--color-mute)] mb-1">
            Account
          </p>
          <p className="text-sm font-semibold mono truncate" title={email}>
            {email}
          </p>
        </div>
        <div className="hidden sm:block w-px bg-white/10 self-stretch" />
        <div className="flex-1 min-w-[140px] text-center">
          <p className="text-[10px] mono uppercase tracking-wider text-[var(--color-mute)] mb-1">
            Role
          </p>
          <p className={`text-sm font-semibold ${role.className}`}>
            {role.label}
          </p>
          <p className="text-[10px] mono text-[var(--color-mute)] mt-0.5">
            {role.note}
          </p>
        </div>
        <div className="hidden sm:block w-px bg-white/10 self-stretch" />
        <div className="flex-1 min-w-[140px] text-center">
          <p className="text-[10px] mono uppercase tracking-wider text-[var(--color-mute)] mb-1">
            Wallet
          </p>
          <p className="text-sm font-semibold mono">
            {linkedAddress ? shortAddress(linkedAddress) : "—"}
          </p>
          <p className="text-[10px] mono text-[var(--color-mute)] mt-0.5">
            {linkedAddress ? "Linked · Base" : "Not linked"}
          </p>
        </div>
      </div>

      <WalletPanel linkedAddress={linkedAddress} />

      {/* Capability cards — responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="card rounded-xl p-6 sm:p-7 ring-1 ring-white/10">
          <h3 className="text-lg font-semibold mb-2">Your products</h3>
          <p className="text-sm text-[var(--color-paper)]/70 leading-relaxed mb-4">
            Per-user project listing lands with the Phase 2 Postgres move. For
            now, jump straight into anything you&rsquo;ve started:
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
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
          <div className="card rounded-xl p-6 sm:p-7 ring-1 ring-[var(--color-rust)]/30">
            <h3 className="text-lg font-semibold mb-2 text-[var(--color-rust)]">
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
          <div
            className={`card rounded-xl p-6 sm:p-7 ring-1 ring-[var(--color-gold)]/25 ${
              superUser ? "md:col-span-2" : ""
            }`}
          >
            <h3 className="text-lg font-semibold mb-2 text-[var(--color-gold)]">
              Admin tools
            </h3>
            <p className="text-sm text-[var(--color-paper)]/70 leading-relaxed mb-4">
              Studio control surfaces — backed by the seven personas below.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              <Link
                href="/studio/site-edits"
                className="rounded-md border border-[var(--color-gold)]/40 hover:bg-[var(--color-gold)]/10 px-3 py-2 transition text-[var(--color-gold)] text-center"
              >
                Studio inbox
              </Link>
              <Link
                href="/studio/queue"
                className="rounded-md border border-[var(--color-gold)]/40 hover:bg-[var(--color-gold)]/10 px-3 py-2 transition text-[var(--color-gold)] text-center"
              >
                Queue
              </Link>
              <Link
                href="/studio/finance"
                className="rounded-md border border-[var(--color-gold)]/40 hover:bg-[var(--color-gold)]/10 px-3 py-2 transition text-[var(--color-gold)] text-center"
              >
                Finance
              </Link>
              <Link
                href="/studio/debates"
                className="rounded-md border border-[var(--color-gold)]/40 hover:bg-[var(--color-gold)]/10 px-3 py-2 transition text-[var(--color-gold)] text-center"
              >
                Debates
              </Link>
            </div>
            <CreateSiteForm />
          </div>
        ) : null}
      </div>

      <SignOutButton />
    </section>
  );
}
