"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const REEL = [1, 2, 3, 4, 5, 7, 8, 9, 10].map((n) => ({
  id: n,
  src: `/movie-reel/${n}.mp4`,
}));

const ADVANCE_MS = 8000;

export function MovieReel() {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback((next: number) => {
    setIndex(((next % REEL.length) + REEL.length) % REEL.length);
  }, []);

  useEffect(() => {
    if (expanded) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIndex((i) => (i + 1) % REEL.length);
    }, ADVANCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [index, expanded]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
  }, [index]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
      if (e.key === "ArrowRight") goTo(index + 1);
      if (e.key === "ArrowLeft") goTo(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, index, goTo]);

  const current = REEL[index];

  return (
    <>
      <figure className="relative w-full rounded-xl overflow-hidden border border-white/10 bg-black aspect-video group">
        <video
          ref={videoRef}
          key={current.id}
          src={current.src}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="w-full h-full object-cover cursor-zoom-in"
          onClick={() => setExpanded(true)}
        />

        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label="Expand video"
          className="absolute top-3 right-3 z-20 px-2.5 py-1.5 rounded-md text-xs mono bg-black/55 hover:bg-black/75 text-white/90 backdrop-blur-sm transition opacity-0 group-hover:opacity-100"
        >
          ⤢ expand · sound
        </button>

        <button
          type="button"
          onClick={() => goTo(index - 1)}
          aria-label="Previous clip"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/55 hover:bg-black/80 text-white text-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          aria-label="Next clip"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/55 hover:bg-black/80 text-white text-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
        >
          ›
        </button>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {REEL.map((clip, i) => (
            <button
              key={clip.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Play clip ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-[var(--color-gold)]" : "w-1.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>

        <figcaption className="absolute bottom-3 right-3 z-20 text-[10px] mono uppercase tracking-widest text-white/70 bg-black/45 px-2 py-1 rounded">
          Made with /movie
        </figcaption>
      </figure>

      {expanded ? (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          onClick={() => setExpanded(false)}
        >
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label="Close"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-xl flex items-center justify-center"
          >
            ×
          </button>
          <video
            ref={modalVideoRef}
            key={`modal-${current.id}`}
            src={current.src}
            autoPlay
            controls
            playsInline
            className="max-w-full max-h-full rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}
