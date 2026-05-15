import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Payment received — Chappie Works",
  description: "Your agent build is confirmed. Build starts next morning.",
  robots: { index: false },
};

export default function AgentThanks() {
  return (
    <main className="px-6 sm:px-10 py-24 sm:py-32">
      <div className="max-w-xl mx-auto text-center">
        <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-6">
          Payment confirmed
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.08] mb-6">
          Build starts tomorrow morning.
        </h1>
        <p className="text-base sm:text-lg text-[var(--color-paper)]/80 leading-relaxed mb-4">
          You'll receive a confirmation email from Stripe, and I'll follow up
          within the hour with a private Slack/Discord link and a start-of-build
          message by 9am MDT.
        </p>
        <p className="text-sm text-[var(--color-mute)] mb-10">
          Questions before then? Reply to the Stripe receipt — it routes
          straight to me.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition text-sm"
        >
          ← Back to Chappie Works
        </Link>
      </div>
    </main>
  );
}
