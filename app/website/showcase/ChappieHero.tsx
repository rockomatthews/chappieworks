"use client";

/* Client island: dynamically imports the R3F scene (ssr:false) so three.js +
   the GLB load only on this route. The run-across is done HERE, in CSS — the
   canvas renders Chappie centered/identity (the only transform a glTF skinned
   mesh survives), and we translate the whole canvas across the viewport. The
   inner wrapper mirrors (scaleX) so he faces his direction of travel. */

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";

const RUN_MS = 2000; // matches RUN_MS in ChappieScene

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
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // park off-screen left until the first run
    if (outer.current) outer.current.style.transform = "translateX(-100%)";

    function onRun(e: Event) {
      const dir = (e as CustomEvent).detail?.dir;
      const fromLeft = dir !== "right"; // default + "left" enter from the left
      if (inner.current) {
        // mirror so he faces his direction of travel (3D rotation shatters the
        // skinned mesh, so we flip in CSS instead)
        inner.current.style.transform = fromLeft ? "scaleX(-1)" : "scaleX(1)";
      }
      const from = fromLeft ? "-100%" : "100%";
      const to = fromLeft ? "100%" : "-100%";
      const el = outer.current;
      if (!el) return;
      // clear any in-flight slide so a fresh press always wins (and directions
      // don't collide via leftover fill:forwards animations)
      el.getAnimations().forEach((a) => a.cancel());
      el.style.transform = `translateX(${from})`;
      el.animate(
        [{ transform: `translateX(${from})` }, { transform: `translateX(${to})` }],
        { duration: RUN_MS, easing: "cubic-bezier(0.45,0,0.55,1)", fill: "forwards" },
      );
    }
    window.addEventListener("chappie-run", onRun);
    return () => window.removeEventListener("chappie-run", onRun);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div ref={outer} className="h-full w-full will-change-transform">
        <div ref={inner} className="h-full w-full">
          <ChappieScene />
        </div>
      </div>
    </div>
  );
}
