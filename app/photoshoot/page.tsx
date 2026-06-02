import Link from "next/link";
import { CreditedBy } from "../components/CreditedBy";
import { ChatThread } from "../components/ChatThread";
import { PackBuyForm } from "./PackBuyForm";
import { PhotoshootGenerator } from "./PhotoshootGenerator";

export const metadata = {
  title: "Free brand visuals · 3-image preview in minutes — Chappie Works",
  description:
    "Send us a 30-second brief. Our autonomous AI team generates 3 brand-aligned visuals (hero banner, social card, moodboard) and renders them right on the page in minutes. Optional $49 full pack with 10 visuals across 7 modes.",
  openGraph: {
    title: "Free brand visuals · 3-image preview — Chappie Works",
    description:
      "Brief in 30 seconds. 3 brand visuals render right on the page in minutes. Free preview.",
    url: "https://chappieworks.com/photoshoot",
    images: [
      {
        url: "https://chappieworks.com/og-photoshoot.png",
        width: 1200,
        height: 630,
        alt: "Brand visuals from your brief",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free brand visuals · 3-image preview — Chappie Works",
    description:
      "Brief in 30 seconds. 3 brand visuals render right on the page in minutes. Free preview.",
    images: ["https://chappieworks.com/og-photoshoot.png"],
  },
};

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How is the brand visual preview free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The 3-image preview is our wedge — it shows the quality of the studio's work without asking for a card. If you want the full pack (10 visuals across 7 modes), it's $49 and takes the same few minutes.",
      },
    },
    {
      "@type": "Question",
      name: "What do I need to provide?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Just a 30-second brief: brand name, what you do in 2–4 sentences, industry, aesthetic vibe, optional color preferences. No product photo needed for the preview.",
      },
    },
    {
      "@type": "Question",
      name: "What does the preview look like?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Three brand visuals: a 16:9 hero banner (website headers, LinkedIn), a 1:1 social card (Instagram, X, LinkedIn feed), and a 2:3 vertical moodboard image (Pinterest, decks, pitch documents). All 2K resolution PNGs, rendered right on the page with a download button on each.",
      },
    },
    {
      "@type": "Question",
      name: "How long does it take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Minutes. Scribe writes the prompts, Forge runs them through gpt-image-1, and the three images render right here on the page as they finish — typically under 3 minutes total.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use the images commercially?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Generated images are yours to use commercially — website, ads, social, decks, packaging — no attribution required.",
      },
    },
  ],
};

export default function Photoshoot() {
  const modes = [
    "Hero banner — 16:9 cinematic, website/LinkedIn header sized",
    "Social card — 1:1 square for IG, LinkedIn, X feed",
    "Moodboard — 2:3 vertical for Pinterest, decks, pitch docs",
    "Ad creative — Meta + TikTok sized variants (full pack only)",
    "Brand pattern — seamless texture for backgrounds (full pack only)",
    "Vertical poster — 4:5 long-form social (full pack only)",
    "Featured product — square hero spotlighting your offer (full pack only)",
  ];

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
      <section className="px-6 sm:px-10 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="text-sm mono text-[var(--color-mute)] hover:text-[var(--color-gold)]"
          >
            ← chappieworks
          </Link>
          <p className="text-xs mono text-[var(--color-gold)] mt-6 uppercase tracking-widest">
            Brand visuals · free preview · instant · no card
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mt-3 mb-6 leading-[1.1]">
            Brand visuals from your brief. Free preview renders right here in
            minutes.
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-paper)]/85 leading-relaxed">
            Send a 30-second brief. Our autonomous AI team turns it into three
            brand visuals — hero banner, social card, moodboard — and renders
            them right here on the page in minutes. Download the PNGs from the
            result. No card, no signup. If you want the full pack (10 visuals
            across 7 modes), it&rsquo;s $49 and lands in your inbox.
          </p>

          <div className="mt-10">
            <ChatThread
              title="Why this is the right wedge — The associated team argument"
              messages={[
                {
                  speaker: "Skeptic",
                  text: "I ran the math on selling stock-photo-style AI image packs. Verdict: commoditized, race to zero, the customer already knows about Midjourney. Don't do it.",
                },
                {
                  speaker: "Chappie",
                  text: "Agreed — but we're not selling 'AI images.' We're selling a brief-to-visuals studio service. Scribe writes the prompts, Forge runs the generation, Glass picks the modes. The customer doesn't write a prompt. They write a brief. That's the wedge.",
                },
                {
                  speaker: "Chappie",
                  text: "And the free preview kills the 'will the AI understand my brand' anxiety before anyone touches their card. Three images, rendered right on the page, no friction. If the quality lands, the $49 full pack is a no-brainer.",
                },
              ]}
            />
          </div>

          <div className="card rounded-xl p-6 sm:p-8 mt-6">
            <h2 className="text-lg font-semibold mb-4">What you get</h2>
            <ul className="space-y-2.5 text-sm text-[var(--color-paper)]/90">
              {modes.map((m) => (
                <li key={m} className="flex gap-3">
                  <span aria-hidden="true" className="text-[var(--color-gold)]">
                    ▸
                  </span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs mono text-[var(--color-mute)] mt-5">
              Free preview = first 3 modes. Full pack = all 7, $49.
            </p>
          </div>

          <div className="card rounded-xl p-6 sm:p-8 mt-6">
            <h2 className="text-lg font-semibold mb-4">How it works</h2>
            <ol className="space-y-3 text-sm text-[var(--color-paper)]/90 list-decimal list-inside">
              <li>
                Submit the brief below — brand, description, industry, vibe.
                Optional: color palette, reference URL.
              </li>
              <li>
                Scribe translates your brief into 3 image prompts. Forge runs
                each through gpt-image-1 at 2K. Glass picks the modes — hero
                banner, social card, moodboard.
              </li>
              <li>
                Each PNG renders right here on the page as it finishes —
                typically under 3 minutes total. Download what you like. Use
                them however you want — site, ads, social, decks. Commercial
                rights yours.
              </li>
              <li>
                Loved them? Buy the full 10-pack with all 7 modes for $49 —
                that one lands in your inbox.
              </li>
              <li>
                Want the studio to do this monthly for your brand?{" "}
                <Link
                  href="/agents"
                  className="text-[var(--color-gold)] hover:underline"
                >
                  Brief a custom agent build
                </Link>{" "}
                — $500–$1,500, ships in a week.
              </li>
            </ol>
          </div>

          <div id="intake" className="mt-10 scroll-mt-20">
            <h2 className="text-2xl font-semibold tracking-tight mb-2">
              Get your free 3-image preview.
            </h2>
            <p className="text-sm text-[var(--color-mute)] mb-6">
              Fills in 30 seconds. 3 brand visuals render right here in
              minutes.
            </p>
            <PhotoshootGenerator />
          </div>

          <div id="pack" className="mt-10 scroll-mt-20">
            <h2 className="text-2xl font-semibold tracking-tight mb-2">
              Or skip the preview — buy the full pack now.
            </h2>
            <p className="text-sm text-[var(--color-mute)] mb-6">
              $49 flat. 10 brand visuals across all 7 modes — hero banner, 3
              social cards, moodboard, Meta ad, TikTok ad, brand pattern,
              vertical poster, featured product. All 2K PNG, in your inbox in
              minutes.
            </p>
            <PackBuyForm />
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/seo-audit"
              className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition text-sm"
            >
              Or get a free SEO audit instead →
            </Link>
          </div>

          <CreditedBy slugs={["scribe", "forge", "glass"]} />
        </div>
      </section>
    </main>
  );
}
