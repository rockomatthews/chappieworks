import Link from "next/link";
import { CreditedBy } from "../components/CreditedBy";
import { ChatThread } from "../components/ChatThread";
import { PhotoshootGenerator } from "./PhotoshootGenerator";

export const metadata = {
  title: "Brand visuals from your own assets · 3 free, full identity pack $49 — Chappie Works",
  description:
    "Upload your logo + photos. Our AI studio reads your real colors and style and renders 3 alluring on-brand visuals free, on the page in minutes. Unlock the full Brand Identity Package — logo treatments, palette, social kit, ad creative, pattern — for $49, checkout right on the page.",
  openGraph: {
    title: "Brand visuals from YOUR assets · 3 free — Chappie Works",
    description:
      "Upload your logo + photos. 3 on-brand visuals render free on the page. Full brand identity package $49.",
    url: "https://chappieworks.com/photoshoot",
    images: [
      {
        url: "https://chappieworks.com/og-photoshoot.png",
        width: 1200,
        height: 630,
        alt: "On-brand visuals from your assets",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Brand visuals from YOUR assets · 3 free — Chappie Works",
    description:
      "Upload your logo + photos. 3 on-brand visuals free. Full identity pack $49.",
    images: ["https://chappieworks.com/og-photoshoot.png"],
  },
};

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Why upload my logo and photos?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "So the visuals look like YOUR brand, not generic AI. We read your real palette and style off your assets and pass them to the image model as references — the output is anchored to your actual identity. It's optional, but the results are dramatically better with them.",
      },
    },
    {
      "@type": "Question",
      name: "What's free vs. paid?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Free: 3 alluring on-brand visuals (a key visual, a hero banner, and a social card), rendered right on the page in minutes, yours to download. Paid ($49): the Full Brand Identity Package — logo treatment, color palette board, social avatar + banner, ad creative, and a seamless brand pattern, all generated from your assets.",
      },
    },
    {
      "@type": "Question",
      name: "Do I have to leave the site to pay?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Checkout is embedded right on the page — you never leave chappieworks.com. The package generates and appears in place once payment clears.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use the images commercially?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — everything generated is yours to use commercially across website, ads, social, decks, and packaging, no attribution required.",
      },
    },
  ],
};

export default function Photoshoot() {
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
            Brand visuals · from your own assets · free preview · no card
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mt-3 mb-6 leading-[1.1]">
            Upload your brand. Get visuals that actually look like you.
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-paper)]/85 leading-relaxed">
            Drop in your logo and a few photos, tell us what you do in a sentence
            or two. Our studio reads your real colors and style and renders{" "}
            <strong>3 alluring on-brand visuals — free</strong>, right here in
            minutes. Love them? Unlock the{" "}
            <strong>Full Brand Identity Package for $49</strong> — logo
            treatment, color palette, social kit, ad creative, and a brand
            pattern — checkout right on this page, no redirect.
          </p>

          {/* The offering, made unmissable */}
          <div className="grid sm:grid-cols-2 gap-4 mt-10">
            <div className="card rounded-xl p-6">
              <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2">Free</p>
              <h2 className="text-lg font-semibold mb-3">3 alluring brand visuals</h2>
              <ul className="space-y-2 text-sm text-[var(--color-paper)]/90">
                {["Key visual — your scroll-stopping hero shot", "Hero banner — site / LinkedIn header", "Social card — square for the feed"].map((m) => (
                  <li key={m} className="flex gap-2"><span className="text-[var(--color-gold)]">▸</span>{m}</li>
                ))}
              </ul>
              <p className="text-xs mono text-[var(--color-mute)] mt-4">Generated from your assets. No card.</p>
            </div>
            <div className="card rounded-xl p-6 border-[var(--color-gold)]/40">
              <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2">$49 · full package</p>
              <h2 className="text-lg font-semibold mb-3">Full Brand Identity Package</h2>
              <ul className="space-y-2 text-sm text-[var(--color-paper)]/90">
                {["Brand identity document — colors, fonts + voice", "Logo treatment + social avatar/banner", "Color palette board", "Ad creative + brand pattern", "All commercial rights · yours"].map((m) => (
                  <li key={m} className="flex gap-2"><span className="text-[var(--color-gold)]">▸</span>{m}</li>
                ))}
              </ul>
              <p className="text-xs mono text-[var(--color-mute)] mt-4">Checkout stays on this page.</p>
            </div>
          </div>

          <div className="mt-8">
            <ChatThread
              title="Why this beats a prompt box — the team's argument"
              messages={[
                {
                  speaker: "Skeptic",
                  text: "Everyone has an AI image generator now. A prompt field is a commodity. Why would anyone use ours?",
                },
                {
                  speaker: "Chappie",
                  text: "Because we don't ask for a prompt — we ask for your brand. Upload your logo and photos; we read your real palette and style and feed them in as references. The output looks like YOU, not generic AI slop. That's the whole difference.",
                },
                {
                  speaker: "Chappie",
                  text: "And the free 3 prove it before anyone pays. If they see their own brand rendered well, the $49 full identity pack is the obvious next click — and they never leave the page to buy it.",
                },
              ]}
            />
          </div>

          <div id="intake" className="mt-10 scroll-mt-20">
            <h2 className="text-2xl font-semibold tracking-tight mb-2">
              Upload your brand → get 3 free visuals.
            </h2>
            <p className="text-sm text-[var(--color-mute)] mb-6">
              Logo + a sentence about what you do. Renders right here in minutes.
            </p>
            <PhotoshootGenerator />
          </div>

          <div className="mt-8 text-center">
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
