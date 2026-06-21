"use client";

/* Client island: dynamically imports the R3F scene with ssr:false so neither
   three.js nor the GLB are part of SSR or any bundle other than this route.
   The whole thing only mounts on /website/showcase. */

import dynamic from "next/dynamic";

const ChappieScene = dynamic(() => import("./ChappieScene"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center">
      <span className="mono text-xs uppercase tracking-[0.3em] text-[var(--color-gold)]/70">
        loading 3D…
      </span>
    </div>
  ),
});

export default function ChappieHero() {
  return (
    <div className="absolute inset-0 z-0" aria-hidden>
      <ChappieScene />
    </div>
  );
}
