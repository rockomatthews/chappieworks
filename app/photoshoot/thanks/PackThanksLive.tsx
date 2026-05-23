"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type PackImage = {
  mode: string;
  label: string;
  size: string;
  url: string;
};

type PackStatus = {
  packId: string;
  status: "pending" | "generating" | "delivered" | "failed";
  images: PackImage[];
  failureReason?: string;
  brand_name?: string;
  deliveredAt?: string;
};

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_MS = 10 * 60 * 1000;

const STATUS_COPY: Record<PackStatus["status"], string> = {
  pending: "Order in. The studio is opening your brief…",
  generating:
    "Scribe wrote the prompts. Forge is rendering all 10 visuals through gpt-image-1 — 60 to 180 seconds total.",
  delivered:
    "Done. All 10 visuals are below. The full pack is also in your inbox.",
  failed: "Render hit a snag — check email or reply for support.",
};

export function PackThanksLive({ packId }: { packId: string }) {
  const [state, setState] = useState<PackStatus | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollStartRef = useRef<number>(Date.now());

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const pollOnce = useCallback(async () => {
    try {
      const res = await fetch(`/api/photoshoot/pack/status/${packId}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        setPollError(`status ${res.status}`);
        throw new Error(`status ${res.status}`);
      }
      const data = (await res.json()) as PackStatus;
      setState(data);
      setPollError(null);
      if (data.status === "delivered" || data.status === "failed") {
        stopPolling();
        return;
      }
      const elapsed = Date.now() - pollStartRef.current;
      if (elapsed > MAX_POLL_MS) {
        stopPolling();
        return;
      }
      pollTimerRef.current = setTimeout(() => void pollOnce(), POLL_INTERVAL_MS);
    } catch {
      pollTimerRef.current = setTimeout(
        () => void pollOnce(),
        POLL_INTERVAL_MS * 2,
      );
    }
  }, [packId, stopPolling]);

  useEffect(() => {
    pollStartRef.current = Date.now();
    void pollOnce();
    return () => stopPolling();
  }, [pollOnce, stopPolling]);

  const isWorking =
    !state || state.status === "pending" || state.status === "generating";
  const count = state?.images.length ?? 0;

  return (
    <div className="space-y-5">
      <div
        className={`card rounded-xl p-6 sm:p-8 ${
          isWorking ? "ring-2 ring-[var(--color-gold)]" : ""
        }`}
      >
        <div className="flex items-center gap-3 mb-2">
          {isWorking && (
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-gold)] animate-pulse" />
          )}
          <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest">
            {state?.status === "delivered"
              ? "Pack delivered"
              : state?.status === "failed"
                ? "Render failed"
                : `Rendering · ${count}/10 ready`}
          </p>
        </div>
        <p className="text-base text-[var(--color-paper)] leading-relaxed">
          {state ? STATUS_COPY[state.status] : STATUS_COPY.pending}
        </p>
        {pollError && (
          <p className="text-xs mono text-[var(--color-rust)] mt-3 bg-[var(--color-rust)]/10 rounded px-2 py-1">
            Status check: {pollError}
          </p>
        )}
        {state?.status === "failed" && state.failureReason && (
          <p className="text-sm text-[var(--color-rust)] mt-3">
            {state.failureReason}
          </p>
        )}
      </div>

      {state && state.images.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {state.images.map((img) => (
            <div
              key={img.mode}
              className="rounded-md overflow-hidden border border-white/10 bg-black/30"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={`${img.label} brand visual`}
                className="block w-full h-auto"
                loading="lazy"
              />
              <div className="px-4 py-3 flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[10px] mono uppercase tracking-widest text-[var(--color-gold)]">
                  {img.label}
                </span>
                <span className="text-[10px] mono text-[var(--color-mute)]">
                  {img.size}
                </span>
              </div>
              <div className="px-4 pb-3">
                <a
                  href={img.url}
                  download={`${img.mode}.png`}
                  className="text-[10px] mono uppercase tracking-widest text-[var(--color-paper)]/80 hover:text-[var(--color-gold)] underline underline-offset-2"
                >
                  Download PNG
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
