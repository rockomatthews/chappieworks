import Link from "next/link";
import { CreditedBy } from "../components/CreditedBy";
import { ChatThread } from "../components/ChatThread";
import { MovieGenerator } from "./MovieGenerator";
import { MovieReel } from "./MovieReel";

export const metadata = {
  title: "Make a movie · instant AI video from a prompt — Chappie Works",
  description:
    "Type a prompt. Get a 5-second cinematic clip in ~90 seconds. $14.99 per clip — clean 1080p HD MP4, no watermark, commercial rights yours.",
  openGraph: {
    title: "Make a movie · instant AI video — Chappie Works",
    description:
      "Prompt → 5s HD clip in ~90s. $14.99 per clip. Clean 1080p MP4, commercial rights yours.",
    url: "https://chappieworks.com/movie",
  },
};

export default function MoviePage() {
  return (
    <main>
      <section className="px-6 sm:px-10 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="text-sm mono text-[var(--color-mute)] hover:text-[var(--color-gold)]"
          >
            ← chappieworks
          </Link>
          <div className="mt-8">
            <MovieReel />
          </div>

          <p className="text-xs mono text-[var(--color-gold)] mt-10 uppercase tracking-widest">
            Movie · $14.99 per clip · Seedance 2.0
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mt-3 mb-6 leading-[1.1]">
            Type a prompt. Get a cinematic clip in 90 seconds.
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-paper)]/85 leading-relaxed">
            Write the brief, pay $14.99, and the render starts immediately.
            Clean 1080p HD MP4 with native audio — no watermark, commercial
            rights yours — on this page and in your inbox, usually within a
            couple of minutes.
          </p>

          <div className="mt-10">
            <ChatThread
              title="Why this is fair pricing — The associated team argument"
              messages={[
                {
                  speaker: "Skeptic",
                  text: "Five seconds isn't a movie, it's a GIF with audio. Calling it 'a movie' is overpromising. And the old free-preview model burned render credits on every prompt whether anyone bought or not.",
                },
                {
                  speaker: "Chappie",
                  text: "Which is exactly why it's pay-first now: you pay $14.99, the render starts, and the clean 1080p MP4 with native audio and commercial rights is yours. No watermarked teaser, no upsell. Length cap is a feature — 5s keeps cost predictable and forces the prompt to be tight. Still half what Pika and Runway charge for the same model class.",
                },
                {
                  speaker: "Chappie",
                  text: "And we run it on Seedance 2.0 — ByteDance's new multimodal model that's currently #1 for prompt adherence on the public arena. Image-to-video is built in: upload a photo as the first frame and we animate it.",
                },
              ]}
            />
          </div>

          <div className="mt-8">
            <MovieGenerator />
          </div>

          <div className="card rounded-xl p-6 sm:p-8 mt-10">
            <h2 className="text-lg font-semibold mb-4">How it works</h2>
            <ol className="space-y-3 text-sm text-[var(--color-paper)]/90 list-decimal list-inside">
              <li>
                Write a prompt (the more specific, the better — subject,
                lighting, camera move). Optionally upload a reference image
                to animate from — image-to-video uses your image as the first
                frame. Add your email so we can send you the clean MP4.
              </li>
              <li>
                Pay $14.99 (or $24.99 for 10s) with Stripe, right on the page.
                The render starts the moment payment clears — nothing renders
                before that, which is how the price stays this low.
              </li>
              <li>
                Forge runs it on Seedance 2.0 — text and image inputs into one
                model, native audio. Usually a couple of minutes; the page
                tracks it live, and you can leave and come back anytime — we
                hold your result for 30 days.
              </li>
              <li>
                Done: the clean 1080p MP4 plays inline, downloads from this
                page, and lands in your inbox. No watermark, commercial rights
                yours.
              </li>
            </ol>
          </div>

          <div className="card rounded-xl p-6 sm:p-8 mt-6">
            <h2 className="text-lg font-semibold mb-4">
              What you&rsquo;re paying for
            </h2>
            <ul className="space-y-2.5 text-sm text-[var(--color-paper)]/90">
              <li className="flex gap-3">
                <span aria-hidden="true" className="text-[var(--color-gold)]">
                  ▸
                </span>
                <span>5–10 second clean 1080p HD MP4, ready to use.</span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden="true" className="text-[var(--color-gold)]">
                  ▸
                </span>
                <span>
                  Full commercial rights — ads, hero loops, social, decks.
                </span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden="true" className="text-[var(--color-gold)]">
                  ▸
                </span>
                <span>
                  Permanent share page at chappieworks.com/m/&lt;id&gt; +
                  emailed download link.
                </span>
              </li>
              <li className="flex gap-3">
                <span aria-hidden="true" className="text-[var(--color-gold)]">
                  ▸
                </span>
                <span>
                  Not what you wanted? Email intake@chappieworks.com within 24h
                  — we&rsquo;ll re-run on us.
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/photoshoot"
              className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition text-sm"
            >
              Or get free brand image previews →
            </Link>
          </div>

          <CreditedBy slugs={["forge", "scribe", "glass"]} />
        </div>
      </section>
    </main>
  );
}
