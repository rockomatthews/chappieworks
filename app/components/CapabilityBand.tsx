// The "we run on the whole frontier" flex, Higgsfield-style — a scrolling band
// of the models + capabilities the studio ships on. Pure CSS marquee, no deps.

const MODELS = [
  "Claude (Opus · Sonnet · Haiku)",
  "GPT-5",
  "Gemini 3",
  "Seedance 2.0",
  "Nano Banana",
  "Veo 3.1",
  "Sora 2",
  "Kling 3.0",
  "Seedream 5 Pro",
  "FLUX",
  "Stable Diffusion",
  "ElevenLabs",
  "Next.js 16",
  "Vercel",
  "Stripe",
];

export function CapabilityBand() {
  return (
    <section className="border-y border-white/10 bg-black/30 py-10">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="flex flex-col gap-1 text-center">
          <p className="mono text-xs uppercase tracking-[0.3em] text-[var(--color-neon)]">
            One studio · every frontier model
          </p>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            We don&rsquo;t pick a model. We pick the{" "}
            <span className="text-[var(--color-gold)]">right</span> one.
          </h2>
        </div>
      </div>
      {/* full-bleed scrolling band */}
      <div className="mt-8 overflow-hidden">
        <div className="cw-band-track">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0" aria-hidden={dup === 1}>
              {MODELS.map((m) => (
                <span
                  key={m + dup}
                  className="mono mx-3 flex items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-[var(--color-raven)]/60 px-5 py-2.5 text-sm text-[var(--color-paper)]/80"
                >
                  <span className="neon-pip inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-neon)]" />
                  {m}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
