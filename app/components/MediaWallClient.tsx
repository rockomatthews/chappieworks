"use client";

import { useEffect, useRef, useState } from "react";

/* Wall cards for the homepage media wall. Videos play muted while on screen
   (IntersectionObserver) and pause off screen so a dozen clips don't melt the
   GPU. Both card types share the tilt-lite hover sheen from fx.css. */

export function WallVideo({ src, eager = false }: { src: string; eager?: boolean }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [inView, setInView] = useState(eager);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (inView) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [inView]);

  return (
    <div className="wall-card group relative overflow-hidden rounded-xl border border-white/10 bg-black">
      <video
        ref={ref}
        src={src}
        muted
        loop
        playsInline
        preload={eager ? "auto" : "metadata"}
        className="block w-full transition duration-500 group-hover:scale-[1.03]"
      />
      <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/50 px-1.5 py-0.5 text-[9px] mono uppercase tracking-widest text-[var(--color-gold)] opacity-0 transition group-hover:opacity-100">
        /movie
      </span>
    </div>
  );
}

export function WallImage({ src }: { src: string }) {
  return (
    <div className="wall-card group relative overflow-hidden rounded-xl border border-white/10 bg-black">
      {/* Blob-hosted, arbitrary dimensions — plain img keeps the masonry flow. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="AI brand visual rendered by Chappie Works"
        loading="lazy"
        className="block w-full transition duration-500 group-hover:scale-[1.03]"
      />
      <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/50 px-1.5 py-0.5 text-[9px] mono uppercase tracking-widest text-[var(--color-gold)] opacity-0 transition group-hover:opacity-100">
        /photoshoot
      </span>
    </div>
  );
}
