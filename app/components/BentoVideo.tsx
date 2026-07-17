"use client";

import { useEffect, useRef, useState } from "react";

// A looping muted clip that plays only while on screen — the video-forward
// tile treatment from Higgsfield's bento grid, kept cheap.
export function BentoVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setInView(e.isIntersecting),
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (inView) el.play().catch(() => {});
    else el.pause();
  }, [inView]);

  return (
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      preload="metadata"
      className="absolute inset-0 h-full w-full object-cover opacity-60 transition duration-500 group-hover:opacity-90 group-hover:scale-[1.04]"
    />
  );
}
