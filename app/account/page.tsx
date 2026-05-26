import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../lib/supabase/server";
import { isBypassEmail } from "../lib/movieEmail";
import { SignOutButton } from "./SignOutButton";
import { WalletPanel } from "./WalletPanel";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Your account — Chappie Works",
  robots: { index: false, follow: false },
};

function isAdmin(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    redirect("/signin?next=/account");
  }

  const email = user.email.toLowerCase();
  const admin = isAdmin(email);
  const superUser = isBypassEmail(email);
  const linkedAddress =
    typeof user.user_metadata?.wallet_address === "string"
      ? user.user_metadata.wallet_address.toLowerCase()
      : null;

  return (
    <main>
      <section className="px-6 sm:px-10 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="text-sm mono text-[var(--color-mute)] hover:text-[var(--color-gold)]"
          >
            ← chappieworks
          </Link>

          <p className="text-xs mono text-[var(--color-gold)] mt-6 uppercase tracking-widest">
            Chappie Works · Your account
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-3 mb-2 leading-[1.1]">
            Welcome back.
          </h1>
          <p className="text-base text-[var(--color-paper)]/85 leading-relaxed mb-3">
            Signed in as <span className="mono text-[var(--color-gold)]">{email}</span>
          </p>
          <div className="flex flex-wrap gap-2 mb-8">
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
            <h2 className="text-lg font-semibold mb-3">Your products</h2>
            <p className="text-sm text-[var(--color-paper)]/70 leading-relaxed">
              Coming soon — this page will list every site, movie, photoshoot,
              brief, and audit you&rsquo;ve started or bought. For now, jump
              into a product:
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
              <h2 className="text-lg font-semibold mb-3 text-[var(--color-rust)]">
                Super User mode
              </h2>
              <p className="text-sm text-[var(--color-paper)]/70 leading-relaxed mb-2">
                When you submit any paid SKU form with{" "}
                <span className="mono text-[var(--color-paper)]/85">{email}</span>{" "}
                as the buyer email, Stripe is bypassed and the unwatermarked /
                full deliverable is emailed to you direct.
              </p>
              <p className="text-xs mono text-[var(--color-mute)]">
                Configured via <span className="text-[var(--color-paper)]/70">BYPASS_CHECKOUT_EMAIL</span> env var. Wired on /movie + /photoshoot pack. Other SKUs being audited next.
              </p>
            </div>
          ) : null}

          {admin ? (
            <div className="card rounded-xl p-6 sm:p-8 mb-6 border-[var(--color-gold)]/30">
              <h2 className="text-lg font-semibold mb-3 text-[var(--color-gold)]">
                Admin tools
              </h2>
              <p className="text-sm text-[var(--color-paper)]/70 leading-relaxed mb-4">
                Studio control surfaces.
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
              </div>
            </div>
          ) : null}

          <SignOutButton />
        </div>
      </section>
    </main>
  );
}
