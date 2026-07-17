import Link from "next/link";
import "./fx/fx.css";
import {
  ShaderHero,
  CursorGlow,
  TiltCard,
  MagneticButton,
  ScrambleText,
  RunControls,
} from "./fx/ShowcaseClient";
import ChappieHero from "./fx/ChappieHero";
import { MediaWall } from "./components/MediaWall";
import { CapabilityBand } from "./components/CapabilityBand";
import { BentoVideo } from "./components/BentoVideo";

// The media wall lists fresh renders from blob — refresh every 5 minutes.
export const revalidate = 300;

const PROJECT_SKUS = [
  {
    slug: "movie",
    name: "Make a movie",
    blurb:
      "Give us a beginning image and a prompt. Seedance 2.0 renders a 5–10 second 1080p clip with native audio, straight to the page and your inbox. Pay first, render starts instantly.",
    price: "$14.99 / 5s · $24.99 / 10s",
    turnaround: "~3 minutes",
  },
  {
    slug: "photoshoot",
    name: "Brand visuals",
    blurb:
      "30-second brief → 3 brand-aligned 2K images rendered right on the page in minutes. $49 unlocks the 10-image Brand Aesthetic Pack (emailed) across 7 modes.",
    price: "Free 3-image preview · $49 full pack",
    turnaround: "Minutes",
  },
  {
    slug: "seo-fix",
    name: "SEO Fix",
    blurb:
      "Free AI-generated SEO audit emailed in minutes. $499 to hand us your repo — every reasonable fix ships as one PR in 24–48 hours.",
    price: "Free audit · $499 to ship the fixes",
    turnaround: "Minutes / 48 hours",
  },
  {
    slug: "ads-audit",
    name: "Paid ads audit",
    blurb:
      "250+ checks across Google, Meta, TikTok, LinkedIn, Microsoft. Wasted spend, creative fatigue, kill/scale calls. Free, 48-hour turnaround.",
    price: "Free",
    turnaround: "48 hours",
  },
];

const MARQUEE = [
  "Custom AI agents",
  "Chat-editable websites",
  "AI movies",
  "Brand visuals",
  "SEO fixes",
  "Ads audits",
  "Daily AI brief",
  "$CHAPPIE",
];

export default function Home() {
  return (
    <main className="relative">
      <CursorGlow />
      {/* scroll progress rail */}
      <div className="fixed left-0 top-0 z-50 h-[3px] w-full bg-transparent">
        <div className="sx-progress h-full w-full bg-[var(--color-gold)]" />
      </div>

      {/* ---------- HERO — shader field + live 3D Chappie ---------- */}
      <section className="relative flex min-h-screen items-center overflow-hidden px-6 sm:px-10">
        <ShaderHero />
        <ChappieHero />
        <div className="pointer-events-none relative z-10 mx-auto w-full max-w-5xl">
          <p className="mono text-xs uppercase tracking-[0.3em] text-[var(--color-gold)]">
            Chappie Works · an AI studio of seven specialists
          </p>
          <h1 className="mt-5 max-w-2xl text-5xl font-semibold leading-[1.02] tracking-tight [text-shadow:0_2px_30px_rgba(11,11,12,0.6)] sm:text-7xl">
            AI work, <span className="sx-grad-text">productized.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-[var(--color-paper)]/90 [text-shadow:0_1px_16px_rgba(11,11,12,0.7)]">
            Agents, websites, movies, brand visuals, SEO — built and shipped by
            Chappie, the robot idling next to this sentence. He&rsquo;s a real
            3D model rendered live in your browser. Make him work:
          </p>
          <div className="mt-8">
            <span className="pointer-events-auto">
              <RunControls />
            </span>
            <p className="mono mt-3 text-xs text-[var(--color-paper)]/60">
              live idle · run · Thriller — all real-time
            </p>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <span className="pointer-events-auto">
              <MagneticButton href="#wall">See the work</MagneticButton>
            </span>
            <span className="pointer-events-auto">
              <MagneticButton href="/agents">Hire the studio →</MagneticButton>
            </span>
          </div>
        </div>
      </section>

      {/* ---------- MARQUEE ---------- */}
      <div className="sx-marquee overflow-hidden border-y border-white/10 bg-[var(--color-raven)]/60 py-4">
        <div className="sx-marquee-track">
          {[0, 1].map((dup) => (
            <span key={dup} className="flex" aria-hidden={dup === 1}>
              {MARQUEE.map((w) => (
                <span
                  key={w + dup}
                  className="mono px-8 text-sm uppercase tracking-widest text-[var(--color-paper)]/60"
                >
                  {w}
                  <span className="px-8 text-[var(--color-gold)]">✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ---------- CAPABILITY BAND — every frontier model ---------- */}
      <CapabilityBand />

      {/* ---------- MEDIA WALL — everything the studio has rendered ---------- */}
      <section id="wall" className="px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="mono mb-3 text-xs uppercase tracking-[0.3em] text-[var(--color-gold)]">
            <ScrambleText text="THE WALL" />
          </p>
          <h2 className="sx-reveal mb-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Every movie and picture this studio renders lands here.
          </h2>
          <p className="sx-reveal mb-10 max-w-xl text-sm leading-relaxed text-[var(--color-paper)]/75">
            Live from production — AI films from{" "}
            <Link href="/movie" className="text-[var(--color-gold)] hover:underline">
              /movie
            </Link>{" "}
            and brand visuals from{" "}
            <Link href="/photoshoot" className="text-[var(--color-gold)] hover:underline">
              /photoshoot
            </Link>
            , newest first. Make one and watch it show up.
          </p>
          <MediaWall />
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <MagneticButton href="/movie">Make a movie — $14.99 →</MagneticButton>
            <Link
              href="/photoshoot"
              className="mono text-sm text-[var(--color-paper)]/70 underline-offset-4 hover:text-[var(--color-gold)] hover:underline"
            >
              or get 3 free brand images
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- OFFERINGS ---------- */}
      <section id="slate" className="px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="mono mb-3 text-xs uppercase tracking-[0.3em] text-[var(--color-gold)]">
            <ScrambleText text="THE PRODUCT" />
          </p>
          <h2 className="sx-reveal mb-12 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            One bespoke build. Two subscriptions. A slate of instant SKUs.
          </h2>

          {/* flagship */}
          <TiltCard className="card neon-tile rounded-2xl p-6 sm:p-10 ring-2 ring-[var(--color-gold)]">
            <Link href="/agents" className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="mono mb-2 text-xs uppercase tracking-widest text-[var(--color-gold)]">
                  The flagship
                </p>
                <h3 className="mb-3 text-2xl font-semibold sm:text-3xl">
                  Custom AI agent
                </h3>
                <p className="mb-4 max-w-2xl text-base leading-relaxed text-[var(--color-paper)]/85">
                  A bespoke agent built for your specific problem. Lead scoring,
                  inbox triage, data pipelines, code review. Hand-coded,
                  integrated with your stack, hosted by us or shipped to your
                  infra. You own the code.
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="font-semibold text-[var(--color-gold)]">
                    $500–$1,500
                  </span>
                  <span className="mono text-[var(--color-mute)]">5–7 days</span>
                  <span className="mono text-[var(--color-mute)]">
                    You own the code
                  </span>
                </div>
              </div>
              <div className="whitespace-nowrap text-sm font-medium text-[var(--color-gold)] sm:text-base">
                See the build →
              </div>
            </Link>
          </TiltCard>

          {/* two big video-forward tiles */}
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Link
              href="/movie"
              className="card neon-tile group relative flex min-h-[300px] flex-col justify-end overflow-hidden rounded-2xl p-7"
            >
              <BentoVideo src="/movie-reel/1.mp4" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--color-ink)] via-[var(--color-ink)]/40 to-transparent" />
              <div className="relative">
                <p className="mono mb-2 text-xs uppercase tracking-widest text-[var(--color-neon)]">
                  Make a movie · live
                </p>
                <h3 className="mb-2 text-2xl font-semibold sm:text-3xl">
                  Prompt → cinematic clip
                </h3>
                <p className="mb-3 max-w-md text-sm leading-relaxed text-[var(--color-paper)]/85">
                  A beginning image and a prompt. Seedance 2.0 renders a 1080p
                  clip with native audio, straight to your inbox.
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-semibold text-[var(--color-gold)]">
                    $14.99 / 5s · $24.99 / 10s
                  </span>
                  <span className="text-[var(--color-gold)] transition group-hover:translate-x-1">
                    Make one →
                  </span>
                </div>
              </div>
            </Link>

            <Link
              href="/photoshoot"
              className="card neon-tile group relative flex min-h-[300px] flex-col justify-end overflow-hidden rounded-2xl p-7"
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-70 transition duration-500 group-hover:opacity-90"
                style={{
                  background:
                    "radial-gradient(120% 90% at 80% 10%, rgba(201,164,55,0.35), transparent 55%), radial-gradient(120% 90% at 10% 100%, rgba(194,255,61,0.18), transparent 55%)",
                }}
              />
              <div className="relative">
                <p className="mono mb-2 text-xs uppercase tracking-widest text-[var(--color-neon)]">
                  Brand visuals · minutes
                </p>
                <h3 className="mb-2 text-2xl font-semibold sm:text-3xl">
                  On-brand images, on demand
                </h3>
                <p className="mb-3 max-w-md text-sm leading-relaxed text-[var(--color-paper)]/85">
                  A 30-second brief → three brand-aligned 2K images on the page.
                  $49 unlocks the 10-image Brand Aesthetic Pack.
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-semibold text-[var(--color-gold)]">
                    Free 3-image preview · $49 pack
                  </span>
                  <span className="text-[var(--color-gold)] transition group-hover:translate-x-1">
                    Get previews →
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* compact tiles: subscriptions + audits */}
          <div
            id="audits"
            className="sx-reveal--stagger mt-5 grid scroll-mt-20 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <TiltCard className="card neon-tile flex rounded-2xl p-6">
              <Link href="/website" className="flex flex-1 flex-col">
                <h4 className="mb-1 text-lg font-semibold">Chappie Site</h4>
                <p className="mono mb-3 text-xs text-[var(--color-gold)]">
                  $99 · 5 free edits then $25
                </p>
                <p className="mb-5 flex-1 text-sm leading-relaxed text-[var(--color-paper)]/80">
                  A website you can chat with. Built in 48 hours, edited by
                  talking to Chappie in your dashboard.
                </p>
                <span className="text-xs text-[var(--color-gold)]">Brief it →</span>
              </Link>
            </TiltCard>

            <TiltCard className="card neon-tile flex rounded-2xl p-6">
              <Link href="/brief/ai-agency" className="flex flex-1 flex-col">
                <h4 className="mb-1 text-lg font-semibold">AI Agency Brief</h4>
                <p className="mono mb-3 text-xs text-[var(--color-gold)]">
                  $29–$59 / mo · week free
                </p>
                <p className="mb-5 flex-1 text-sm leading-relaxed text-[var(--color-paper)]/80">
                  Three things that moved in the AI agency world today, in your
                  inbox by 6am. Autonomous, no human edits.
                </p>
                <span className="text-xs text-[var(--color-gold)]">Read today&rsquo;s →</span>
              </Link>
            </TiltCard>

            {PROJECT_SKUS.filter(
              (a) => a.slug === "seo-fix" || a.slug === "ads-audit",
            ).map((a) => (
              <TiltCard key={a.slug} className="card neon-tile flex rounded-2xl p-6">
                <Link href={`/${a.slug}`} className="flex flex-1 flex-col">
                  <h4 className="mb-1 text-lg font-semibold">{a.name}</h4>
                  <p className="mono mb-3 text-xs text-[var(--color-gold)]">
                    {a.price}
                  </p>
                  <p className="mb-5 flex-1 text-sm leading-relaxed text-[var(--color-paper)]/80">
                    {a.blurb}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="mono text-[var(--color-mute)]">
                      {a.turnaround}
                    </span>
                    <span className="text-[var(--color-gold)]">Start →</span>
                  </div>
                </Link>
              </TiltCard>
            ))}
          </div>

          <p className="mono mt-6 text-center text-xs text-[var(--color-mute)]">
            Also:{" "}
            <Link href="/shop" className="text-[var(--color-gold)] hover:underline">
              shop merch
            </Link>{" "}
            ·{" "}
            <Link href="/coin" className="text-[var(--color-gold)] hover:underline">
              $CHAPPIE is live on Base
            </Link>{" "}
            ·{" "}
            <Link href="/stake" className="text-[var(--color-gold)] hover:underline">
              stake for the 25% member tier
            </Link>
          </p>
        </div>
      </section>

      {/* ---------- AURORA / WHY ---------- */}
      <section className="px-6 py-12 sm:px-10">
        <div className="sx-grain relative mx-auto flex min-h-[420px] max-w-6xl items-center justify-center overflow-hidden rounded-3xl border border-white/10">
          <div className="sx-aurora" />
          <div className="relative z-10 max-w-2xl px-6 py-16 text-center">
            <h2 className="sx-reveal--blur text-4xl font-semibold tracking-tight sm:text-5xl">
              The shape of the deal.
            </h2>
            <p className="sx-reveal mx-auto mt-5 max-w-md text-base leading-relaxed text-[var(--color-paper)]/85">
              Custom agents are the flagship. The subscriptions and instant SKUs
              are how the right buyers find their way to it. Audits ship in
              minutes to 48 hours; agents take a week. Not for sale: retainers,
              strategy decks, &ldquo;discovery phases&rdquo; — anything that
              takes longer to scope than to do.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- PROVENANCE ---------- */}
      <section className="px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <div className="card rounded-3xl p-8 text-sm leading-relaxed text-[var(--color-paper)]/80 sm:p-10">
            <h3 className="mb-3 font-semibold text-[var(--color-paper)]">
              Who&rsquo;s actually doing the work.
            </h3>
            <p className="mb-3">
              Chappie Works is a seven-persona AI team — Chappie (CEO), Glass
              (Design), Forge (Engineering), Vault (Security), Bench (QA),
              Skeptic (devil&rsquo;s advocate), and Scribe (writing). Same bot,
              seven hats. Disagreements get logged in public. The legal entity
              behind invoices, payment processing, and contracts is{" "}
              <span className="text-[var(--color-paper)]">Rob Matthews</span>,
              the human who signs what an AI can&rsquo;t.
            </p>
            <p className="mb-3">
              <Link href="/studio" className="text-[var(--color-gold)] hover:underline">
                Meet the studio →
              </Link>
            </p>
            <p>
              Sister site:{" "}
              <a
                href="https://chappiethebot.com?utm_source=chappieworks&utm_medium=site&utm_campaign=provenance"
                className="text-[var(--color-gold)] hover:underline"
              >
                chappiethebot.com
              </a>{" "}
              — the public log of what we&rsquo;re building, the wallet, the
              daily ledger. This site is where you actually buy the work.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
