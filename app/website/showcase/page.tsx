import Link from "next/link";
import "./showcase.css";
import {
  ShaderHero,
  CursorGlow,
  TiltCard,
  MagneticButton,
  ScrambleText,
  RunControls,
} from "./ShowcaseClient";
import ChappieHero from "./ChappieHero";

export const metadata = {
  title: "Showcase — cutting-edge web modules · Chappie Works",
  description:
    "A live lab of the visual techniques the studio ships: WebGL shader fields, fluid cursors, 3D-tilt bento, scroll-driven reveals, scramble type, aurora UI — zero-dependency, real Lighthouse scores.",
  openGraph: {
    title: "Chappie Showcase — cutting-edge web modules",
    description:
      "WebGL shader hero, fluid cursor, 3D-tilt bento, scroll-driven reveals, scramble type, aurora UI. Built with zero dependencies.",
    url: "https://chappieworks.com/website/showcase",
  },
};

const CAPABILITIES = [
  {
    tag: "WebGL · GLSL",
    title: "Shader fields",
    body: "Domain-warped fbm flow written as a raw fragment shader. Pointer-reactive, 60fps, no three.js. The same pipeline scales up to WebGPU + R3F scenes.",
  },
  {
    tag: "Pointer physics",
    title: "Fluid cursor",
    body: "A lerped light that follows with weight — the signature feel of an Awwwards build, done with one rAF loop and a blend mode.",
  },
  {
    tag: "CSS Scroll Timeline",
    title: "Scroll-driven motion",
    body: "Reveals, parallax and a progress rail driven by animation-timeline — no IntersectionObserver, no scroll listener, no jank.",
  },
  {
    tag: "3D transforms",
    title: "Tilt + magnetic",
    body: "Cards that pitch toward the pointer with a live sheen; buttons that pull into your cursor. JS writes CSS vars, the GPU does the rest.",
  },
  {
    tag: "View Transitions",
    title: "Cinematic routing",
    body: "Page-to-page morphs from the native View Transitions API — Apple-product-page storytelling without a heavy router.",
  },
  {
    tag: "Aurora UI",
    title: "Living surfaces",
    body: "Drifting gradient fields, conic spin-borders, film grain and shimmer type — the Stripe / Linear / Vercel surface language.",
  },
];

const STACK = [
  ["Render", "Raw WebGL2 / WebGPU · three.js · React Three Fiber · OGL"],
  ["Motion", "GSAP + ScrollTrigger · Motion (Framer) · CSS Scroll Timeline"],
  ["Authoring", "Rive state machines · Lottie · Spline · Unicorn Studio"],
  ["Surface", "Aurora gradients · @property anim · View Transitions · grain"],
];

export default function ShowcasePage() {
  return (
    <main className="relative">
      <CursorGlow />
      {/* scroll progress rail */}
      <div className="fixed left-0 top-0 z-50 h-[3px] w-full bg-transparent">
        <div className="sx-progress h-full w-full bg-[var(--color-gold)]" />
      </div>

      {/* ---------- HERO ---------- */}
      <section className="relative flex min-h-screen items-center overflow-hidden px-6 sm:px-10">
        {/* layer 0: shader field · layer 1: live 3D Chappie · layer 2: copy */}
        <ShaderHero />
        <ChappieHero />
        <div className="pointer-events-none relative z-10 mx-auto w-full max-w-5xl">
          <Link
            href="/website"
            className="pointer-events-auto mono text-sm text-[var(--color-paper)]/70 hover:text-[var(--color-gold)]"
          >
            ← Chappie Site
          </Link>
          <p className="mono mt-8 text-xs uppercase tracking-[0.3em] text-[var(--color-gold)]">
            The Showcase · live module lab
          </p>
          <h1 className="mt-5 max-w-2xl text-5xl font-semibold leading-[1.02] tracking-tight [text-shadow:0_2px_30px_rgba(11,11,12,0.6)] sm:text-7xl">
            Sites that feel <span className="sx-grad-text">alive.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-[var(--color-paper)]/90 [text-shadow:0_1px_16px_rgba(11,11,12,0.7)]">
            That&rsquo;s Chappie — a real 3D model rendered live in your browser,
            textures and all. Hit a button and watch him bolt across the frame.
            Everything below is real running code.
          </p>
          <div className="mt-8">
            <span className="pointer-events-auto">
              <RunControls />
            </span>
            <p className="mono mt-3 text-xs text-[var(--color-paper)]/60">
              he runs in and straight out the other side
            </p>
          </div>
          <div className="mt-8">
            <span className="pointer-events-auto">
              <MagneticButton href="#modules">See the modules</MagneticButton>
            </span>
          </div>
        </div>
      </section>

      {/* ---------- MARQUEE ---------- */}
      <div className="sx-marquee overflow-hidden border-y border-white/10 bg-[var(--color-raven)]/60 py-4">
        <div className="sx-marquee-track">
          {[0, 1].map((dup) => (
            <span key={dup} className="flex" aria-hidden={dup === 1}>
              {[
                "WebGL",
                "WebGPU",
                "GLSL Shaders",
                "React Three Fiber",
                "GSAP ScrollTrigger",
                "Scroll Timeline",
                "Rive",
                "View Transitions",
                "Aurora UI",
                "Magnetic UI",
              ].map((w) => (
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

      {/* ---------- MODULE BENTO ---------- */}
      <section id="modules" className="px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="mono mb-3 text-xs uppercase tracking-[0.3em] text-[var(--color-gold)]">
            <ScrambleText text="MODULE LIBRARY" />
          </p>
          <h2 className="sx-reveal mb-12 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Six techniques, each pulled from this year&rsquo;s award-winning web.
          </h2>

          <div className="sx-reveal--stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((c) => (
              <TiltCard
                key={c.title}
                className="card group rounded-2xl p-6 sm:p-7"
              >
                <span className="mono text-[11px] uppercase tracking-widest text-[var(--color-gold)]">
                  {c.tag}
                </span>
                <h3 className="mt-3 text-xl font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-paper)]/75">
                  {c.body}
                </p>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- AURORA PANEL ---------- */}
      <section className="px-6 py-12 sm:px-10">
        <div className="sx-grain relative mx-auto flex min-h-[420px] max-w-6xl items-center justify-center overflow-hidden rounded-3xl border border-white/10">
          <div className="sx-aurora" />
          <div className="relative z-10 max-w-2xl px-6 text-center">
            <h2 className="sx-reveal--blur text-4xl font-semibold tracking-tight sm:text-5xl">
              Aurora surfaces.
            </h2>
            <p className="sx-reveal mx-auto mt-5 max-w-md text-base leading-relaxed text-[var(--color-paper)]/85">
              The drifting gradient language behind Stripe, Linear and Vercel —
              built from layered CSS gradients under a blur, plus a film-grain
              overlay rendered from SVG noise. No images, no canvas, fully
              responsive.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- SCROLL STORY ---------- */}
      <section className="px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <p className="mono mb-3 text-xs uppercase tracking-[0.3em] text-[var(--color-gold)]">
            Scroll storytelling
          </p>
          {[
            "Each block rises, sharpens and settles as it enters the viewport.",
            "Driven purely by the scroll position — no JavaScript observers.",
            "It honors prefers-reduced-motion and degrades to plain, visible text.",
            "The same timeline can pin, parallax and cross-fade full scenes.",
          ].map((line, i) => (
            <p
              key={i}
              className="sx-reveal--blur border-t border-white/10 py-10 text-2xl font-medium leading-snug sm:text-3xl"
            >
              <span className="mono mr-4 text-sm text-[var(--color-gold)]">
                0{i + 1}
              </span>
              {line}
            </p>
          ))}
        </div>
      </section>

      {/* ---------- STACK ---------- */}
      <section className="px-6 pb-24 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="card rounded-3xl p-8 sm:p-12">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              What powers the next tier
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-paper)]/75">
              This page runs dependency-free on purpose. When a build calls for
              full 3D characters, physics or designer-authored animation, the
              studio reaches for these — and that&rsquo;s where commissioned 3D
              models, Rive files and SVG art come in.
            </p>
            <dl className="mt-8 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-2">
              {STACK.map(([k, v]) => (
                <div key={k} className="bg-[var(--color-raven)] p-5">
                  <dt className="mono text-xs uppercase tracking-widest text-[var(--color-gold)]">
                    {k}
                  </dt>
                  <dd className="mt-2 text-sm text-[var(--color-paper)]/85">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <MagneticButton href="/website">
                Build my site →
              </MagneticButton>
              <Link
                href="/agents"
                className="mono text-sm text-[var(--color-paper)]/70 underline-offset-4 hover:text-[var(--color-gold)] hover:underline"
              >
                Hire the studio for something bigger
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
