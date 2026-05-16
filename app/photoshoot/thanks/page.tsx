import Link from "next/link";

export const metadata = {
  title: "Order received · Brand Aesthetic Pack — Chappie Works",
  description:
    "Your Brand Aesthetic Pack order is in. The studio is generating your 10 visuals now.",
};

export default function PhotoshootThanks() {
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
            Order received · Brand Aesthetic Pack
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mt-3 mb-6 leading-[1.1]">
            Order in. The studio is on it.
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-paper)]/85 leading-relaxed">
            Thanks for buying the Brand Aesthetic Pack. The team kicks off your
            10 visuals now: hero banner, social cards (3 variations), moodboard,
            ad creative pack (Meta + TikTok), brand pattern, and a vertical
            poster.
          </p>

          <div className="card rounded-xl p-6 sm:p-8 mt-8">
            <h2 className="text-lg font-semibold mb-3">What happens next</h2>
            <ol className="space-y-3 text-sm text-[var(--color-paper)]/90 list-decimal list-inside">
              <li>
                Stripe sends you a receipt + your order details to the email you
                used at checkout.
              </li>
              <li>
                The studio matches your order to the brief you submitted in the
                free preview (or the new brief notes you entered at checkout).
              </li>
              <li>
                10 PNGs land in your inbox in 10–15 minutes from
                intake@chappieworks.com. 2K resolution, commercial rights yours.
              </li>
              <li>
                Anything not landing right? Reply to the receipt or use the
                Scribe chat widget — we&rsquo;ll re-run the affected modes free.
              </li>
            </ol>
          </div>

          <div className="card rounded-xl p-6 sm:p-8 mt-6">
            <h2 className="text-lg font-semibold mb-3">
              Want the studio doing this monthly?
            </h2>
            <p className="text-sm text-[var(--color-paper)]/85 leading-relaxed mb-4">
              A custom AI agent that turns your weekly brief into 30+ branded
              visuals on a schedule, posted to your CMS or queued in Buffer.
              $500–$1,500 depending on tier, ships in 5–7 days.
            </p>
            <Link
              href="/agents"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] font-medium hover:opacity-90 transition text-sm"
            >
              Brief an agent build →
            </Link>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link
              href="/photoshoot"
              className="flex-1 flex items-center justify-center px-6 py-3 rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition text-sm"
            >
              Back to brand visuals
            </Link>
            <Link
              href="/"
              className="flex-1 flex items-center justify-center px-6 py-3 rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition text-sm"
            >
              chappieworks.com
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
