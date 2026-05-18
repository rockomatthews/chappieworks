"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function WatermarkOverlay({ jobId }: { jobId: string }) {
  return (
    <svg
      className="absolute inset-0 rounded-md pointer-events-none z-10"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
      style={{ width: "100%", height: "100%" }}
    >
      {/* Center watermark */}
      <text
        x="960"
        y="540"
        fontSize="120"
        fontWeight="bold"
        fill="rgba(255,255,255,0.35)"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="sans-serif"
      >
        CHAPPIE WORKS PREVIEW
      </text>

      {/* Bottom watermark */}
      <text
        x="960"
        y="980"
        fontSize="48"
        fill="rgba(255,255,255,0.5)"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="monospace"
      >
        chappieworks.com/movie · buy to remove
      </text>
    </svg>
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

const MAX_IMAGE_MB = 4;

export function MovieGenerator() {
  const [prompt, setPrompt] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<JobStatus | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);
  const pollStartRef = useRef<number>(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollAttemptsRef = useRef<number>(0);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const renderPanelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!image) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setImage(null);
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`Reference image must be under ${MAX_IMAGE_MB} MB.`);
      e.target.value = "";
      return;
    }
    setImage(file);
    setError(null);
  }

  function clearImage() {
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

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
    const failValidation = (msg: string) => {
      setError(msg);
      requestAnimationFrame(() => {
        errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    };
    if (prompt.trim().length < 10) {
      failValidation("Prompt should be at least 10 characters.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      failValidation(
        "Please add a valid email below — we email the unwatermarked HD MP4 if you buy.",
      );
      return;
    }
    setSubmitting(true);
    setPollError(null);
    stopPolling();
    pollAttemptsRef.current = 0;
    // Immediately show the rendering state so mobile users see feedback
    // before the network round-trip resolves.
    setJob({ jobId: "starting", status: "pending", paid: false });
    requestAnimationFrame(() => {
      renderPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    try {
      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("email", email);
      if (image) {
        formData.append("image", image);
      }
      const res = await fetch("/api/movie/generate", {
        method: "POST",
        body: formData,
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
      setJob(null);
      setError(err instanceof Error ? err.message : "Couldn't kick off render");
      requestAnimationFrame(() => {
        errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
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
              className="w-full bg-[var(--color-ink)] border border-white/15 rounded-md px-3 py-2 text-base sm:text-sm text-[var(--color-paper)] placeholder:text-[var(--color-mute)] focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]/50"
              style={{ fontSize: "16px" }}
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
              htmlFor="movie-image"
              className="block text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2"
            >
              Reference image · optional
            </label>
            {imagePreview ? (
              <div className="flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Reference image preview"
                  className="w-24 h-24 object-cover rounded-md border border-white/15"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--color-paper)]/85 leading-relaxed">
                    The studio will use this as the first frame and animate it
                    using your prompt. Drop the image if you&rsquo;d rather
                    generate from text alone.
                  </p>
                  <button
                    type="button"
                    onClick={clearImage}
                    className="mt-2 text-[10px] mono uppercase tracking-widest text-[var(--color-rust)] hover:underline"
                  >
                    Remove image
                  </button>
                </div>
              </div>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  id="movie-image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageChange}
                  className="block w-full text-xs text-[var(--color-paper)]/85 file:mr-3 file:px-3 file:py-2 file:rounded-md file:border-0 file:bg-[var(--color-gold)]/15 file:text-[var(--color-gold)] file:text-xs file:mono file:uppercase file:tracking-widest hover:file:bg-[var(--color-gold)]/25"
                />
                <p className="text-[10px] mono text-[var(--color-mute)] mt-1.5">
                  Adding an image switches us to image-to-video — the studio
                  animates your reference. PNG/JPG/WebP, under 4 MB. Leave
                  empty for pure text-to-video.
                </p>
              </>
            )}
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
              autoComplete="email"
              inputMode="email"
              className="w-full bg-[var(--color-ink)] border border-white/15 rounded-md px-3 py-2 text-base sm:text-sm text-[var(--color-paper)] placeholder:text-[var(--color-mute)] focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]/50"
              style={{ fontSize: "16px" }}
            />
            <p className="text-[10px] mono text-[var(--color-mute)] mt-1.5">
              We email the unwatermarked HD MP4 if you buy. No spam.
            </p>
          </div>

          {error && (
            <p
              ref={errorRef}
              role="alert"
              className="text-sm text-[var(--color-rust)] bg-[var(--color-rust)]/10 border border-[var(--color-rust)]/40 rounded-md px-3 py-2 scroll-mt-24"
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
        <div
          ref={renderPanelRef}
          className="card rounded-xl p-6 sm:p-8 ring-2 ring-[var(--color-gold)] scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-gold)] animate-pulse" />
            <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest">
              {job.jobId === "starting"
                ? "Starting render…"
                : `Rendering · job ${job.jobId.slice(0, 8)}`}
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
          {job.jobId !== "starting" && (
            <p className="text-xs mono text-[var(--color-mute)] mt-3">
              You can stay here or come back later — we&rsquo;ll keep the result
              for 30 days at /m/{job.jobId.slice(0, 8)}…
            </p>
          )}
        </div>
      )}

      {job && job.status === "ready" && job.previewUrl && (
        <div className="space-y-5">
          <div className="card rounded-xl p-4 ring-2 ring-[var(--color-gold)] overflow-hidden">
            <div
              className="relative w-full bg-black rounded-md overflow-hidden"
              onContextMenu={(e) => e.preventDefault()}
            >
              <video
                src={job.previewUrl}
                controls
                controlsList="nodownload"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                className="w-full rounded-md block"
                style={{ pointerEvents: "auto" }}
              />
              <WatermarkOverlay jobId={job.jobId} />
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 mt-4">
              <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest">
                Preview · watermarked
              </p>
              <p className="text-[10px] mono text-[var(--color-mute)]">
                /m/{job.jobId.slice(0, 8)}…
              </p>
            </div>
          </div>

          <div
            className="card rounded-xl p-6 sm:p-8"
            style={{
              background:
                "linear-gradient(135deg, rgba(201,164,55,0.1), rgba(201,164,55,0.02))",
              border: "1px solid rgba(201,164,55,0.4)",
            }}
          >
            <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2">
              Like it? Unlock the clean version.
            </p>
            <h3 className="text-xl font-semibold mb-2">
              Buy the unwatermarked HD video — $14.99
            </h3>
            <p className="text-sm text-[var(--color-paper)]/85 mb-5 leading-relaxed">
              Get the 1080p MP4 without watermark in your inbox + on this page.
              Commercial rights yours.
            </p>
            <button
              onClick={() => void startCheckout()}
              disabled={checkoutLoading}
              className="w-full sm:w-auto px-6 py-3 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {checkoutLoading ? "Opening checkout…" : "Buy clean HD — $14.99 →"}
            </button>
            <p className="text-xs mono text-[var(--color-mute)] mt-3">
              Secure checkout via Stripe. Apple Pay / Google Pay supported.
            </p>
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
