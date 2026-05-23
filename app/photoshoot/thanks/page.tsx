import Link from "next/link";
import { PackThanksLive } from "./PackThanksLive";

export const metadata = {
  title: "Order received · Brand Aesthetic Pack — Chappie Works",
  description:
    "Your Brand Aesthetic Pack order is in. Visuals render here as the studio finishes each one — full pack also lands in your inbox.",
};

export const dynamic = "force-dynamic";

export default async function PhotoshootThanks({
  searchParams,
}: {
  searchParams: Promise<{ pack?: string; bypass?: string }>;
}) {
  const params = await searchParams;
  const packId = params.pack?.trim();

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
            Thanks for buying the Brand Aesthetic Pack. Your 10 visuals render
            below as each one finishes — hero banner, social cards (3
            variations), moodboard, ad creative (Meta + TikTok), brand pattern,
            and a vertical poster. The full pack also lands in your inbox as a
            backup.
          </p>

          {packId && (
            <div className="mt-8">
              <PackThanksLive packId={packId} />
            </div>
          )}

          <div className="card rounded-xl p-6 sm:p-8 mt-8">
            <h2 className="text-lg font-semibold mb-3">What happens next</h2>
            <ol className="space-y-3 text-sm text-[var(--color-paper)]/90 list-decimal list-inside">
              <li>
                Stripe sends you a receipt to the email you used at checkout.
              </li>
              <li>
                Scribe translates your brief into 10 image prompts. Forge runs
                each through gpt-image-1 at 2K. Glass picks the modes.
              </li>
              <li>
                Visuals appear above as each one renders — typically all 10
                within 2–5 minutes. Download what you want with the PNG link
                on each image. Commercial rights yours.
              </li>
              <li>
                Backup copy lands in your inbox from intake@chappieworks.com.
                Check spam just in case.
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
