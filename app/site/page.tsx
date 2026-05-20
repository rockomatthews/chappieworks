import Link from "next/link";

export const metadata = {
  title: "Chappie Site · sign in — Chappie Works",
  robots: { index: false, follow: false },
};

export default async function SiteIndex({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorCopy =
    error === "missing"
      ? "Your sign-in link was empty — request a new one from your dashboard."
      : error === "invalid"
        ? "That sign-in link is no longer valid. It expires after 15 minutes — request a fresh one and try again."
        : null;

  return (
    <main>
      <section className="px-6 sm:px-10 py-16 sm:py-20">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="text-sm mono text-[var(--color-mute)] hover:text-[var(--color-gold)]"
          >
            ← chappieworks
          </Link>
          <p className="text-xs mono text-[var(--color-gold)] mt-6 uppercase tracking-widest">
            Chappie Site · private dashboard
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-3 mb-4 leading-[1.1]">
            Open your dashboard from your inbox.
          </h1>
          <p className="text-base text-[var(--color-paper)]/85 leading-relaxed">
            Your private edit thread lives at a unique URL we emailed you when
            your site went live. Open that link to sign in. Lost it? Reply to
            any email from <span className="mono">intake@chappieworks.com</span>{" "}
            and we&rsquo;ll resend it.
          </p>
          {errorCopy ? (
            <div className="mt-6 rounded-md border border-[var(--color-rust)]/40 bg-[var(--color-rust)]/10 px-4 py-3 text-sm text-[var(--color-paper)]/90">
              {errorCopy}
            </div>
          ) : null}
          <div className="mt-10">
            <Link
              href="/website"
              className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition text-sm"
            >
              Don&rsquo;t have a Chappie Site yet? →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
