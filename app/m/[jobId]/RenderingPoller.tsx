"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 5000;

const STATUS_COPY = {
  pending: "Queued — starting the render…",
  generating: "Rendering your clip. 60–120 seconds.",
  watermarking: "Almost there — burning the watermark on the preview.",
} as const;

export function RenderingPoller({
  jobId,
  status,
}: {
  jobId: string;
  status: keyof typeof STATUS_COPY;
}) {
  const router = useRouter();
  const lastStatusRef = useRef<string>(status);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      try {
        const res = await fetch(`/api/movie/status/${jobId}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = (await res.json()) as { status?: string };
        if (cancelled) return;
        if (data.status && data.status !== lastStatusRef.current) {
          lastStatusRef.current = data.status;
          router.refresh();
          if (data.status === "ready" || data.status === "failed") return;
        }
      } catch {
        // swallow — we'll retry on the next tick
      }
      if (!cancelled) {
        timer = setTimeout(tick, POLL_INTERVAL_MS);
      }
    }

    timer = setTimeout(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [jobId, router]);

  return (
    <div className="card rounded-xl p-6 sm:p-8 ring-1 ring-[var(--color-gold)]/30">
      <div className="flex items-center gap-3 mb-3">
        <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-gold)] animate-pulse" />
        <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest">
          Rendering · job {jobId.slice(0, 8)}
        </p>
      </div>
      <p className="text-base text-[var(--color-paper)] leading-relaxed">
        {STATUS_COPY[status]}
      </p>
      <p className="text-xs mono text-[var(--color-mute)] mt-3">
        Keep this tab open — it updates automatically when the clip is ready.
      </p>
    </div>
  );
}
