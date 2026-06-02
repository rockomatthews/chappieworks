import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import { CreateSiteForm } from "./CreateSiteForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Studio · Admin tools — Chappie Works",
  robots: { index: false, follow: false },
};

function isAdminEmail(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export default async function AdminTools() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isAdminEmail(user.email)) {
    redirect("/studio");
  }

  return (
    <main>
      <section className="px-6 sm:px-10 py-16 sm:py-20">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/studio"
            className="text-sm mono text-[var(--color-mute)] hover:text-[var(--color-gold)]"
          >
            ← The Studio
          </Link>

          <p className="text-xs mono text-[var(--color-gold)] mt-6 uppercase tracking-widest">
            Studio · Admin tools
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-3 mb-2 leading-[1.1]">
            Admin tools.
          </h1>
          <p className="text-sm text-[var(--color-paper)]/70 mb-10 leading-relaxed">
            Operator shortcuts not exposed to the public. Visible only to{" "}
            <span className="mono text-[var(--color-paper)]/90">ADMIN_EMAILS</span>.
          </p>

          <section>
            <h2 className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-4">
              Create site — bypass intake
            </h2>
            <p className="text-sm text-[var(--color-paper)]/75 mb-5 leading-relaxed">
              Provision a{" "}
              <Link href="/website" className="text-[var(--color-gold)] hover:underline">
                /website
              </Link>{" "}
              customer dashboard without the public intake form. Use when a
              customer paid offline, was onboarded manually, or needs immediate
              access. No Stripe charge is triggered — admin bypass.
            </p>
            <CreateSiteForm />
          </section>

          <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-4 text-sm">
            <Link href="/studio/site-edits" className="text-[var(--color-gold)] hover:underline mono">
              Site edits inbox →
            </Link>
            <Link href="/studio/queue" className="text-[var(--color-gold)] hover:underline mono">
              Queue →
            </Link>
            <Link href="/studio/finance" className="text-[var(--color-gold)] hover:underline mono">
              Finance →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
