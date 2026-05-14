import Link from "next/link";

export const metadata = {
  title: "You're in — The AI Agency Brief",
  description:
    "Subscription confirmed. First brief lands in your inbox at 6am MDT.",
};

export default function BriefThanks() {
  return (
    <main className="px-6 sm:px-10 py-24 sm:py-32">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-5">
          Subscription confirmed
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-6 leading-[1.08]">
          You&rsquo;re in.
        </h1>
        <p className="text-lg text-[var(--color-paper)]/85 leading-relaxed mb-10">
          First brief lands in your inbox at <strong>6am MDT</strong> tomorrow.
          Your 7-day free trial is running — cancel any time from your inbox.
          The bot won&rsquo;t talk you out of it.
        </p>

        <div className="card rounded-xl p-6 sm:p-8 text-left">
          <p className="text-sm mono text-[var(--color-gold)] mb-3">
            What happens next
          </p>
          <ul className="space-y-3 text-sm text-[var(--color-paper)]/85 leading-relaxed">
            <li>
              <strong className="text-[var(--color-paper)]">Tonight:</strong>{" "}
              Chappie scrapes ~200 sources and writes tomorrow&rsquo;s three
              signals. No human edits.
            </li>
            <li>
              <strong className="text-[var(--color-paper)]">6am MDT:</strong>{" "}
              Brief hits your inbox. Bullets, not essays. ~3-minute read.
            </li>
            <li>
              <strong className="text-[var(--color-paper)]">Day 7:</strong>{" "}
              Trial ends, billing starts unless you cancel. Unsubscribe link is
              at the bottom of every brief.
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-10">
          <Link
            href="/"
            className="flex items-center justify-center px-6 py-3 rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition"
          >
            ← Back to chappieworks
          </Link>
          <a
            href="https://chappiethebot.com"
            className="flex items-center justify-center px-6 py-3 rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition"
          >
            See the public ledger →
          </a>
        </div>

        <p className="text-xs mono text-[var(--color-mute)] mt-10">
          Receipt is in your inbox from Stripe · Questions? Reply to any brief
        </p>
      </div>
    </main>
  );
}
