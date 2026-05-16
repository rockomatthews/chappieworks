"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function WatermarkOverlay({ jobId }: { jobId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updateCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;

      canvas.width = rect.width;
      canvas.height = rect.height;

      ctx.fillStyle = "rgba(0, 0, 0, 0)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = "bold 72px sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const text = "CHAPPIE WORKS PREVIEW";
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);

      ctx.font = "28px sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fillText("chappieworks.com/movie · buy to remove", canvas.width / 2, canvas.height - 40);
    };

    updateCanvas();
    window.addEventListener("resize", updateCanvas);
    return () => window.removeEventListener("resize", updateCanvas);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 rounded-md pointer-events-none"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

type JobStatus = {
  jobId: string;
  status: "pending" | "generating" | "watermarking" | "ready" | "failed";
  paid: boolean;
  previewUrl?: string;
  cleanUrl?: string;
  failureReason?: string;
  prompt?: string;
};

const POLL_INTERVAL_MS = 4000;
const MAX_POLL_DURATION_MS = 8 * 60 * 1000;

const STATUS_COPY: Record<JobStatus["status"], string> = {
  pending: "Queued — starting the render…",
  generating: "Forge is rendering your clip. 60–120 seconds.",
  watermarking: "Almost there — burning the watermark on the preview.",
  ready: "Ready. Watch it below.",
  failed: "The render failed. Try a different prompt.",
};

export function MovieGenerator() {
  const [prompt, setPrompt] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<JobStatus | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);
  const pollStartRef = useRef<number>(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollAttemptsRef = useRef<number>(0);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const pollOnce = useCallback(
    async (jobId: string) => {
      pollAttemptsRef.current += 1;
      try {
        const res = await fetch(`/api/movie/status/${jobId}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          const msg = `status check failed (${res.status})`;
          console.error("[movie:poll]", msg);
          setPollError(msg);
          throw new Error(msg);
        }
        const data = (await res.json()) as JobStatus;
        setJob(data);
        setPollError(null);

        if (data.status === "ready" || data.status === "failed") {
          stopPolling();
          return;
        }
        const elapsed = Date.now() - pollStartRef.current;
        if (elapsed > MAX_POLL_DURATION_MS) {
          stopPolling();
          setError(
            "This is taking longer than expected. Reload the page in a minute to check again.",
          );
          return;
        }
        pollTimerRef.current = setTimeout(
          () => void pollOnce(jobId),
          POLL_INTERVAL_MS,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown error";
        console.error("[movie:poll]", "attempt", pollAttemptsRef.current, msg);
        setPollError(msg);
        pollTimerRef.current = setTimeout(
          () => void pollOnce(jobId),
          POLL_INTERVAL_MS * 2,
        );
      }
    },
    [stopPolling],
  );

  useEffect(() => () => stopPolling(), [stopPolling]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (prompt.trim().length < 10) {
      setError("Prompt should be at least 10 characters.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Add a valid email so we can send the clean MP4 if you buy.");
      return;
    }
    setSubmitting(true);
    setJob(null);
    setPollError(null);
    stopPolling();
    pollAttemptsRef.current = 0;
    try {
      const res = await fetch("/api/movie/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, email }),
      });
      const data = (await res.json()) as { jobId?: string; error?: string };
      if (!res.ok || !data.jobId) {
        throw new Error(data.error ?? `request failed (${res.status})`);
      }
      const jobId = data.jobId;
      setJob({ jobId, status: "pending", paid: false });
      pollStartRef.current = Date.now();
      pollTimerRef.current = setTimeout(
        () => void pollOnce(jobId),
        POLL_INTERVAL_MS,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't kick off render");
    } finally {
      setSubmitting(false);
    }
  }

  async function startCheckout() {
    if (!job || job.status !== "ready") return;
    setCheckoutLoading(true);
    try {
      const res = await fetch(`/api/movie/checkout/${job.jobId}`, {
        method: "POST",
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "couldn't start checkout");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "checkout failed");
      setCheckoutLoading(false);
    }
  }

  const showForm = !job || job.status === "failed";
  const isRendering =
    job && (job.status === "pending" || job.status === "generating" || job.status === "watermarking");

  return (
    <div className="space-y-6">
      {showForm && (
        <form
          onSubmit={submit}
          className="card rounded-xl p-6 sm:p-8 space-y-5"
        >
          <div>
            <label
              htmlFor="movie-prompt"
              className="block text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2"
            >
              Prompt *
            </label>
            <textarea
              id="movie-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A close-up of a hand pouring espresso into a glass cup. Warm morning light from a window. Slow motion. Cinematic, shallow depth of field."
              rows={5}
              maxLength={800}
              required
              className="w-full bg-[var(--color-ink)] border border-white/15 rounded-md px-3 py-2 text-sm text-[var(--color-paper)] placeholder:text-[var(--color-mute)] focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]/50"
            />
            <div className="flex justify-between mt-1.5 text-[10px] mono text-[var(--color-mute)]">
              <span>
                Tip: be specific. Subject, lighting, camera move, mood.
              </span>
              <span>{prompt.length} / 800</span>
            </div>
          </div>

          <div>
            <label
              htmlFor="movie-email"
              className="block text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2"
            >
              Email *
            </label>
            <input
              id="movie-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="w-full bg-[var(--color-ink)] border border-white/15 rounded-md px-3 py-2 text-sm text-[var(--color-paper)] placeholder:text-[var(--color-mute)] focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]/50"
            />
            <p className="text-[10px] mono text-[var(--color-mute)] mt-1.5">
              We email the unwatermarked HD MP4 if you buy. No spam.
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="text-sm text-[var(--color-rust)] bg-[var(--color-rust)]/10 rounded-md px-3 py-2"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Starting…" : "Generate my free preview →"}
          </button>

          <p className="text-xs mono text-[var(--color-mute)] text-center">
            Free to preview. $14.99 to unlock the HD download.
          </p>
        </form>
      )}

      {isRendering && job && (
        <div className="rounded-xl p-6 sm:p-8 ring-2 ring-red-600 bg-red-900/70">
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-gold)] animate-pulse" />
            <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest">
              Rendering · job {job.jobId.slice(0, 8)}
            </p>
          </div>
          <p className="text-base text-[var(--color-paper)] leading-relaxed">
            {STATUS_COPY[job.status]}
          </p>
          {pollError && (
            <p className="text-xs mono text-[var(--color-rust)] mt-3 bg-[var(--color-rust)]/10 rounded px-2 py-1">
              Status check: {pollError}
            </p>
          )}
          <p className="text-xs mono text-[var(--color-mute)] mt-3">
            You can stay here or come back later — we&rsquo;ll keep the result
            for 30 days at /m/{job.jobId.slice(0, 8)}…
          </p>
        </div>
      )}

      {job && job.status === "ready" && job.previewUrl && (
        <div className="space-y-5">
          <div className="card rounded-xl p-4 ring-2 ring-[var(--color-gold)] overflow-hidden">
            <div className="relative w-full bg-black rounded-md">
              <video
                src={job.previewUrl}
                controls
                autoPlay
                loop
                playsInline
                className="w-full rounded-md block"
              />
              <WatermarkOverlay jobId={job.jobId} />
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 mt-4">
              <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest">
                HD Preview
              </p>
              <p className="text-[10px] mono text-[var(--color-mute)]">
                /m/{job.jobId.slice(0, 8)}…
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setJob(null);
              setError(null);
              stopPolling();
            }}
            className="w-full text-sm text-[var(--color-paper)]/70 hover:text-[var(--color-gold)] underline underline-offset-4 transition"
          >
            ← Try a different prompt
          </button>
        </div>
      )}

      {job && job.status === "failed" && (
        <div className="card rounded-xl p-6 ring-1 ring-[var(--color-rust)]/40">
          <p className="text-xs mono text-[var(--color-rust)] uppercase tracking-widest mb-2">
            Render failed
          </p>
          <p className="text-sm text-[var(--color-paper)]/85">
            {job.failureReason ??
              "Something went sideways on Replicate. Try a slightly different prompt."}
          </p>
        </div>
      )}
    </div>
  );
}
