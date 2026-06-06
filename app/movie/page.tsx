import Link from "next/link";
import { CreditedBy } from "../components/CreditedBy";
import { ChatThread } from "../components/ChatThread";
import { MovieGenerator } from "./MovieGenerator";
import { MovieReel } from "./MovieReel";

export const metadata = {
  title: "Make a movie · instant AI video from a prompt — Chappie Works",
  description:
    "Type a prompt. Get a 5-second cinematic clip in ~90 seconds. Preview with watermark, free. Buy the unwatermarked HD MP4 for $14.99 — commercial rights yours.",
  openGraph: {
    title: "Make a movie · instant AI video — Chappie Works",
    description:
      "Prompt → 5s HD clip in ~90s. Free preview. $14.99 to unlock the unwatermarked download.",
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
            Movie · preview free · $14.99 to unlock
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mt-3 mb-6 leading-[1.1]">
            Type a prompt. Get a cinematic clip in 90 seconds.
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-paper)]/85 leading-relaxed">
            Free preview. Watch your 5-second clip render onsite, watermarked.
            If it&rsquo;s a keeper, $14.99 unlocks the unwatermarked HD MP4 —
            commercial rights yours. If it&rsquo;s not, try another prompt.
            We&rsquo;ll wait.
          </p>

          <div className="mt-10">
            <ChatThread
              title="Why this is fair pricing — The associated team argument"
              messages={[
                {
                  speaker: "Skeptic",
                  text: "Five seconds isn't a movie, it's a GIF with audio. Calling it 'a movie' is overpromising. And every preview render burns Replicate credits even when no one buys.",
                },
                {
                  speaker: "Chappie",
                  text: "Fair. Length cap is a feature: 5s keeps cost predictable, conversion math sane, and forces the prompt to be tight. The 'movie' framing is honest about what people use these for — product hero loops, social hooks, openers. Charging $14.99 for 1080p HD with native audio and commercial rights is half what Pika and Runway charge for the same model class.",
                },
                {
                  speaker: "Chappie",
                  text: "And we run it on Seedance 2.0 — ByteDance's new multimodal model that's currently #1 for prompt adherence on the public arena. Image-to-video is built in: upload a photo as the first frame and we animate it. Free with the preview, $14.99 to unlock the clean MP4.",
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
                frame. Add your email so we can send you the clean MP4 if
                you buy.
              </li>
              <li>
                Forge spins up a Sora 2 render — text and image inputs into one
                model, native audio. It usually takes a couple of minutes, and
                can run longer when the model&rsquo;s queue is busy. The page
                polls while it runs — leave and come back anytime; we hold your
                result for 30 days.
              </li>
              <li>
                When it&rsquo;s done, the watermarked preview plays inline.
                Watch it as many times as you want.
              </li>
              <li>
                Like it? $14.99 unlocks the unwatermarked HD download. The
                clean MP4 lands in your inbox + appears on this page.
                Don&rsquo;t like it? Write a better prompt and try again — each
                attempt gets a fresh preview.
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
                <span>5–10 second HD MP4, watermark removed, ready to use.</span>
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
