"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import {
  StripeCheckoutModal,
  canEmbedCheckout,
} from "@/app/components/StripeCheckoutModal";

function WatermarkOverlay() {
  return (
    <svg
      className="absolute inset-0 rounded-md pointer-events-none z-10"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
      style={{ width: "100%", height: "100%" }}
    >
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
  status:
    | "awaiting_payment"
    | "pending"
    | "generating"
    | "watermarking"
    | "ready"
    | "failed";
  paid: boolean;
  previewUrl?: string;
  cleanUrl?: string;
  failureReason?: string;
  prompt?: string;
  mode?: "text" | "image" | "video";
  durationSec?: number;
  inputVideoUrl?: string;
};

type Duration = 5 | 10;

const POLL_INTERVAL_MS = 4000;
const MAX_POLL_DURATION_MS = 15 * 60 * 1000;

const STATUS_COPY: Record<JobStatus["status"], string> = {
  awaiting_payment: "Brief saved — complete checkout to start the render.",
  pending: "Queued — starting the render…",
  generating:
    "Forge is rendering your clip. Usually a couple of minutes — sometimes 5+ when the model's queue is busy. Leave and come back anytime; we hold your result.",
  watermarking: "Almost there — finalizing the preview.",
  ready: "Ready. Watch it below.",
  failed: "The render failed. Try a different prompt.",
};

const MAX_IMAGE_MB = 4;
const MAX_VIDEO_MB = 100;
const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-matroska",
]);
const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

const PRICE_5S = "$14.99";
const PRICE_10S = "$24.99";

type Mode = "text" | "image" | "video";

export function MovieGenerator() {
  const [prompt, setPrompt] = useState("");
  const [email, setEmail] = useState("");
  const [duration, setDuration] = useState<Duration>(5);
  const [tier, setTier] = useState<"standard" | "raw">("standard");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<JobStatus | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutClientSecret, setCheckoutClientSecret] = useState<
    string | null
  >(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const pollStartRef = useRef<number>(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollAttemptsRef = useRef<number>(0);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const renderPanelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived: which mode is active based on what's uploaded. The single file
  // input accepts both images and videos and we route based on the picked
  // file's MIME type. Extension mode (video) locks duration to 10s.
  const mode: Mode = video ? "video" : image ? "image" : "text";
  const effectiveDuration: Duration = mode === "video" ? 10 : duration;
  const priceLabel = effectiveDuration === 10 ? PRICE_10S : PRICE_5S;

  const uploadLabel = useMemo(() => {
    switch (mode) {
      case "video":
        return "Extend this clip · +10 seconds";
      case "image":
        return "Animate this image · give it motion";
      default:
        return "Reference image or video · optional";
    }
  }, [mode]);

  const uploadHelp = useMemo(() => {
    switch (mode) {
      case "video":
        return "We'll continue your clip with a new 10-second beat — same vibe, your direction. Pay, and the clean extension renders straight to this page + your inbox.";
      case "image":
        return "We'll use this as the first frame and animate it. Cartoon, logo, product shot, photo — anything.";
      default:
        return "Drop an image to give it motion, or drop a video to extend it by 10 seconds. PNG/JPG/WebP up to 4 MB, MP4/MOV/WebM up to 100 MB. Leave empty for pure text-to-video.";
    }
  }, [mode]);

  useEffect(() => {
    if (!image) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  useEffect(() => {
    if (!video) {
      setVideoPreview(null);
      return;
    }
    const url = URL.createObjectURL(video);
    setVideoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [video]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setImage(null);
      setVideo(null);
      return;
    }
    if (IMAGE_TYPES.has(file.type)) {
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        setError(`Reference image must be under ${MAX_IMAGE_MB} MB.`);
        e.target.value = "";
        return;
      }
      setImage(file);
      setVideo(null);
      setError(null);
      return;
    }
    if (VIDEO_TYPES.has(file.type)) {
      if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
        setError(`Video must be under ${MAX_VIDEO_MB} MB.`);
        e.target.value = "";
        return;
      }
      setVideo(file);
      setImage(null);
      setError(null);
      return;
    }
    setError("Unsupported file. Try PNG/JPG/WebP or MP4/MOV/WebM.");
    e.target.value = "";
  }

  function clearUpload() {
    setImage(null);
    setVideo(null);
    setVideoUploadProgress(null);
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
        "Please add a valid email below — we email your clean HD MP4 there.",
      );
      return;
    }
    setSubmitting(true);
    setPollError(null);
    stopPolling();
    pollAttemptsRef.current = 0;
    setJob({ jobId: "starting", status: "pending", paid: false });
    requestAnimationFrame(() => {
      renderPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    try {
      // Video files are too big for the server multipart limit. Upload
      // direct to Vercel Blob from the browser first, then submit the URL.
      let inputVideoUrl: string | undefined;
      if (video) {
        setVideoUploadProgress(0);
        const blob = await upload(video.name, video, {
          access: "public",
          handleUploadUrl: "/api/movie/blob-upload",
          onUploadProgress: ({ percentage }) => {
            setVideoUploadProgress(Math.min(99, Math.round(percentage)));
          },
        });
        inputVideoUrl = blob.url;
        setVideoUploadProgress(100);
      }

      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("email", email);
      formData.append("duration", String(effectiveDuration));
      formData.append("tier", tier);
      if (image) formData.append("image", image);
      if (inputVideoUrl) formData.append("inputVideoUrl", inputVideoUrl);

      const res = await fetch("/api/movie/generate", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as { jobId?: string; error?: string };
      if (!res.ok || !data.jobId) {
        throw new Error(data.error ?? `request failed (${res.status})`);
      }
      const jobId = data.jobId;
      // Pay-first: the brief is recorded server-side but nothing renders until
      // checkout completes. Open payment immediately.
      setJob({ jobId, status: "awaiting_payment", paid: false, mode });
      await startCheckout(jobId);
    } catch (err) {
      setJob(null);
      setError(err instanceof Error ? err.message : "Couldn't kick off render");
      requestAnimationFrame(() => {
        errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    } finally {
      setSubmitting(false);
      setVideoUploadProgress(null);
    }
  }

  async function startCheckout(jobIdOverride?: string) {
    const jobId = jobIdOverride ?? job?.jobId;
    if (!jobId || jobId === "starting") return;
    setCheckoutLoading(true);
    setError(null);
    try {
      const embedded = canEmbedCheckout();
      const res = await fetch(`/api/movie/checkout/${jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embedded }),
      });
      const data = (await res.json()) as {
        url?: string;
        clientSecret?: string;
        error?: string;
        bypassed?: boolean;
      };
      if (!res.ok) throw new Error(data.error ?? "couldn't start checkout");
      // Embedded: open the on-page panel. Otherwise fall back to redirect.
      if (data.clientSecret) {
        setCheckoutClientSecret(data.clientSecret);
        setCheckoutLoading(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("couldn't start checkout");
    } catch (err) {
      setError(err instanceof Error ? err.message : "checkout failed");
      setCheckoutLoading(false);
    }
  }

  const showForm = !job;
  const isRendering =
    job &&
    (job.status === "pending" ||
      job.status === "generating" ||
      job.status === "watermarking");

  const readyPriceLabel =
    job?.durationSec === 10 ? PRICE_10S : PRICE_5S;
  const isExtensionResult = job?.mode === "video";

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
              {mode === "video"
                ? "Direction for the next 10s *"
                : mode === "image"
                  ? "How should it move? *"
                  : "Describe your scene *"}
            </label>
            <textarea
              id="movie-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                mode === "video"
                  ? "Continue the same scene — camera pushes in slowly, subject turns toward the light, beat lands on the final note."
                  : mode === "image"
                    ? "Camera pushes in slowly. Subject blinks, looks up. Soft wind in the hair. Cinematic, shallow depth of field."
                    : "A close-up of a hand pouring espresso into a glass cup. Warm morning light from a window. Slow motion. Cinematic, shallow depth of field."
              }
              rows={5}
              maxLength={800}
              required
              className="w-full bg-[var(--color-ink)] border border-white/15 rounded-md px-3 py-2 text-base sm:text-sm text-[var(--color-paper)] placeholder:text-[var(--color-mute)] focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]/50"
              style={{ fontSize: "16px" }}
            />
            <div className="flex justify-between mt-1.5 text-[10px] mono text-[var(--color-mute)]">
              <span>
                {mode === "video"
                  ? "The previous clip is your anchor. The next 10s picks up from its final frame."
                  : "Tip: be specific. Subject, lighting, camera move, mood."}
              </span>
              <span>{prompt.length} / 800</span>
            </div>
          </div>

          <div>
            <label
              htmlFor="movie-file"
              className="block text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2"
            >
              {uploadLabel}
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
                    {uploadHelp}
                  </p>
                  <button
                    type="button"
                    onClick={clearUpload}
                    className="mt-2 text-[10px] mono uppercase tracking-widest text-[var(--color-rust)] hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : videoPreview ? (
              <div className="flex items-start gap-3">
                <video
                  src={videoPreview}
                  className="w-32 h-20 object-cover rounded-md border border-white/15 bg-black"
                  muted
                  playsInline
                  preload="metadata"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--color-paper)]/85 leading-relaxed">
                    {uploadHelp}
                  </p>
                  <button
                    type="button"
                    onClick={clearUpload}
                    className="mt-2 text-[10px] mono uppercase tracking-widest text-[var(--color-rust)] hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  id="movie-file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,video/mp4,video/quicktime,video/webm,video/x-matroska"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-[var(--color-paper)]/85 file:mr-3 file:px-3 file:py-2 file:rounded-md file:border-0 file:bg-[var(--color-gold)]/15 file:text-[var(--color-gold)] file:text-xs file:mono file:uppercase file:tracking-widest hover:file:bg-[var(--color-gold)]/25"
                />
                <p className="text-[10px] mono text-[var(--color-mute)] mt-1.5">
                  {uploadHelp}
                </p>
              </>
            )}
          </div>

          <div>
            <label className="block text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2">
              Duration
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDuration(5)}
                disabled={mode === "video"}
                className={`px-4 py-3 rounded-md border text-sm transition ${
                  effectiveDuration === 5
                    ? "border-[var(--color-gold)] bg-[var(--color-gold)]/10 text-[var(--color-gold)]"
                    : "border-white/15 text-[var(--color-paper)]/80 hover:border-white/30"
                } ${mode === "video" ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <div className="font-medium">5 seconds</div>
                <div className="text-[10px] mono text-[var(--color-mute)] mt-0.5">
                  {PRICE_5S}
                </div>
              </button>
              <button
                type="button"
                onClick={() => setDuration(10)}
                className={`px-4 py-3 rounded-md border text-sm transition ${
                  effectiveDuration === 10
                    ? "border-[var(--color-gold)] bg-[var(--color-gold)]/10 text-[var(--color-gold)]"
                    : "border-white/15 text-[var(--color-paper)]/80 hover:border-white/30"
                }`}
              >
                <div className="font-medium">10 seconds</div>
                <div className="text-[10px] mono text-[var(--color-mute)] mt-0.5">
                  {PRICE_10S}
                </div>
              </button>
            </div>
            {mode === "video" && (
              <p className="text-[10px] mono text-[var(--color-mute)] mt-1.5">
                Extensions are always 10s — the cadence is the director&rsquo;s lever.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2">
              Engine
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTier("standard")}
                className={`px-4 py-3 rounded-md border text-sm transition ${
                  tier === "standard"
                    ? "border-[var(--color-gold)] bg-[var(--color-gold)]/10 text-[var(--color-gold)]"
                    : "border-white/15 text-[var(--color-paper)]/80 hover:border-white/30"
                }`}
              >
                <div className="font-medium">Standard</div>
                <div className="text-[10px] mono text-[var(--color-mute)] mt-0.5">
                  Kling · best quality, 1080p
                </div>
              </button>
              <button
                type="button"
                onClick={() => setTier("raw")}
                className={`px-4 py-3 rounded-md border text-sm transition ${
                  tier === "raw"
                    ? "border-[var(--color-rust)] bg-[var(--color-rust)]/10 text-[var(--color-rust)]"
                    : "border-white/15 text-[var(--color-paper)]/80 hover:border-white/30"
                }`}
              >
                <div className="font-medium">Raw</div>
                <div className="text-[10px] mono text-[var(--color-mute)] mt-0.5">
                  Wan · fewer content filters
                </div>
              </button>
            </div>
            {tier === "raw" && (
              <p className="text-[10px] mono text-[var(--color-mute)] mt-1.5 leading-relaxed">
                Raw uses an open model with far fewer restrictions (e.g. cinematic
                violence). Illegal content is still blocked. Quality varies more
                than Standard.
              </p>
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
              Your clean HD MP4 lands here when the render finishes. No spam.
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

          {videoUploadProgress !== null && (
            <p className="text-xs mono text-[var(--color-gold)]">
              Uploading video… {videoUploadProgress}%
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? video
                ? "Uploading & starting…"
                : "Starting…"
              : mode === "video"
                ? `Create my +10s extension — ${PRICE_10S} →`
                : `Create my video — ${priceLabel} →`}
          </button>

          <p className="text-xs mono text-[var(--color-mute)] text-center">
            {priceLabel} per clip, charged before the render. Clean 1080p MP4,
            no watermark, emailed to you.
          </p>
        </form>
      )}

      {job && job.status === "awaiting_payment" && (
        <div
          ref={renderPanelRef}
          className="card rounded-xl p-6 sm:p-8 ring-2 ring-[var(--color-gold)]/70 scroll-mt-24"
          style={{
            background:
              "linear-gradient(135deg, rgba(201,164,55,0.1), rgba(201,164,55,0.02))",
          }}
        >
          <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2">
            Brief saved · pay to render
          </p>
          <h3 className="text-xl font-semibold mb-2">
            {`Create my ${job.durationSec === 10 ? "10s" : "5s"} video — ${readyPriceLabel}`}
          </h3>
          <p className="text-sm text-[var(--color-paper)]/85 mb-5 leading-relaxed">
            Pay once and the render starts immediately. Clean 1080p MP4, no
            watermark — on this page and in your inbox, usually within a couple
            of minutes. Commercial rights yours.
          </p>
          <button
            onClick={() => void startCheckout()}
            disabled={checkoutLoading}
            className="w-full sm:w-auto px-6 py-3 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {checkoutLoading
              ? "Opening checkout…"
              : `Pay ${readyPriceLabel} & render →`}
          </button>
          <p className="text-xs mono text-[var(--color-mute)] mt-3">
            Secure checkout via Stripe. Apple Pay / Google Pay supported.
          </p>
          {checkoutClientSecret && (
            <StripeCheckoutModal
              clientSecret={checkoutClientSecret}
              onClose={() => setCheckoutClientSecret(null)}
            />
          )}
          <button
            onClick={() => {
              setJob(null);
              setError(null);
              setCheckoutClientSecret(null);
              stopPolling();
            }}
            className="block mt-5 text-sm text-[var(--color-paper)]/70 hover:text-[var(--color-gold)] underline underline-offset-4 transition"
          >
            ← Edit the prompt instead
          </button>
        </div>
      )}

      {isRendering && job && (
        <div
          ref={renderPanelRef}
          className="rounded-xl p-6 sm:p-8 ring-2 ring-red-500/80 bg-red-950/50 scroll-mt-24"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <p className="text-xs mono text-red-400 uppercase tracking-widest">
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
              You can leave this page and come back — we&rsquo;ll keep the result
              for 30 days at{" "}
              <a
                href={`/m/${job.jobId}`}
                className="text-[var(--color-gold)] underline underline-offset-2 hover:opacity-80 break-all"
              >
                chappieworks.com/m/{job.jobId.slice(0, 8)}
              </a>
            </p>
          )}
        </div>
      )}

      {job && job.status === "ready" && job.previewUrl && (
        <div className="space-y-5">
          {isExtensionResult && job.inputVideoUrl && (
            <div className="card rounded-xl p-4 overflow-hidden">
              <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-3">
                Your clip · plays first
              </p>
              <div className="relative w-full bg-black rounded-md overflow-hidden">
                <video
                  src={job.inputVideoUrl}
                  controls
                  controlsList="nodownload"
                  playsInline
                  preload="metadata"
                  className="w-full rounded-md block"
                />
              </div>
            </div>
          )}

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
              />
              {/* Server-burned watermark covers extension mode. Other modes
                  rely on this SVG overlay until the buyer unlocks. */}
              {!isExtensionResult && <WatermarkOverlay />}
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 mt-4">
              <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest">
                {isExtensionResult
                  ? "Your +10s extension · preview"
                  : "Preview · watermarked"}
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
              {isExtensionResult
                ? `Buy the unwatermarked extension — ${readyPriceLabel}`
                : `Buy the unwatermarked HD video — ${readyPriceLabel}`}
            </h3>
            <p className="text-sm text-[var(--color-paper)]/85 mb-5 leading-relaxed">
              {isExtensionResult
                ? "Buy it to remove the watermark and get the clean 1080p MP4 of your extension, in your inbox + on this page. Stack another 10s anytime by uploading this clip again."
                : "Buy it to remove the watermark and get the clean 1080p MP4, in your inbox + on this page. Commercial rights yours."}
            </p>
            <button
              onClick={() => void startCheckout()}
              disabled={checkoutLoading}
              className="w-full sm:w-auto px-6 py-3 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {checkoutLoading
                ? "Opening checkout…"
                : `Buy clean HD — ${readyPriceLabel} →`}
            </button>
            <p className="text-xs mono text-[var(--color-mute)] mt-3">
              Secure checkout via Stripe. Apple Pay / Google Pay supported.
            </p>
            {checkoutClientSecret && (
              <StripeCheckoutModal
                clientSecret={checkoutClientSecret}
                onClose={() => setCheckoutClientSecret(null)}
              />
            )}
          </div>

          <button
            onClick={() => {
              setJob(null);
              setError(null);
              setPrompt("");
              setEmail("");
              clearUpload();
              stopPolling();
            }}
            className="w-full text-sm text-[var(--color-paper)]/70 hover:text-[var(--color-gold)] underline underline-offset-4 transition"
          >
            ← Try a different prompt
          </button>
        </div>
      )}

      {job && job.status === "failed" && (
        <div className="card rounded-xl p-6 ring-1 ring-[var(--color-rust)]/40 space-y-4">
          <div>
            <p className="text-xs mono text-[var(--color-rust)] uppercase tracking-widest mb-2">
              Render failed
            </p>
            <p className="text-sm text-[var(--color-paper)]/85">
              {job.failureReason ??
                "The generation didn't complete. Try a slightly different prompt."}
            </p>
          </div>
          <button
            onClick={() => {
              setJob(null);
              setError(null);
              setPrompt("");
              setEmail("");
              clearUpload();
              stopPolling();
            }}
            className="w-full px-4 py-2 text-sm font-medium rounded-md bg-[var(--color-rust)]/20 text-[var(--color-rust)] hover:bg-[var(--color-rust)]/30 transition"
          >
            Try again with a new prompt
          </button>
        </div>
      )}
    </div>
  );
}
