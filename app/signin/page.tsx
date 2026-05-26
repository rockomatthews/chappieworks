import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../lib/supabase/server";
import { SignInForm } from "./SignInForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sign in — Chappie Works",
  description: "Sign in to your Chappie Works account.",
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect(next && next.startsWith("/") ? next : "/account");
  }

  const errorCopy =
    error === "missing"
      ? "Your sign-in link was empty — request a new one below."
      : error === "invalid"
        ? "That sign-in link is no longer valid. Magic links expire after a short window — request a fresh one and try again."
        : null;

  return (
    <main>
      <section className="px-6 sm:px-10 py-16 sm:py-20">
        <div className="max-w-md mx-auto">
          <Link
            href="/"
            className="text-sm mono text-[var(--color-mute)] hover:text-[var(--color-gold)]"
          >
            ← chappieworks
          </Link>
          <p className="text-xs mono text-[var(--color-gold)] mt-6 uppercase tracking-widest">
            Chappie Works · Account
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-3 mb-3 leading-[1.1]">
            Sign in or create your account.
          </h1>
          <p className="text-base text-[var(--color-paper)]/80 leading-relaxed mb-8">
            Enter your email. We&rsquo;ll send a one-click sign-in link — works
            whether you have an account or not.
          </p>

          {errorCopy ? (
            <div className="mb-6 rounded-md border border-[var(--color-rust)]/40 bg-[var(--color-rust)]/10 px-4 py-3 text-sm text-[var(--color-paper)]/90">
              {errorCopy}
            </div>
          ) : null}

          <SignInForm next={next} />

          <p className="mt-8 text-xs text-[var(--color-mute)] leading-relaxed">
            More sign-in options (X, Farcaster, wallet) coming soon.
          </p>
        </div>
      </section>
    </main>
  );
}
