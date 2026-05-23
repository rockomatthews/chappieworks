"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type PhotoshootImage = {
  mode: string;
  modeLabel: string;
  size: string;
  url: string;
};

type JobStatus = {
  jobId: string;
  status: "pending" | "generating" | "ready" | "failed";
  images: PhotoshootImage[];
  failureReason?: string;
  brand_name?: string;
};

const INDUSTRIES = [
  "DTC product / e-commerce",
  "SaaS / software",
  "Restaurant / food / beverage",
  "Fashion / apparel",
  "Health / wellness / fitness",
  "Beauty / skincare",
  "Agency / professional services",
  "Crypto / fintech",
  "Real estate",
  "Other",
];

const VIBES = [
  "Modern minimal — clean, white space, refined",
  "Bold + maximal — saturated, playful, energetic",
  "Luxe / premium — moody, deep tones, cinematic",
  "Earthy / organic — natural, grounded, warm",
  "Tech / editorial — futuristic, sharp, monochrome",
  "Retro / nostalgic — film grain, faded, throwback",
  "Surreal / conceptual — dreamlike, abstract",
];

const POLL_INTERVAL_MS = 4000;
const MAX_POLL_MS = 6 * 60 * 1000;

const STATUS_COPY: Record<JobStatus["status"], string> = {
  pending: "Queued — the studio is opening your brief…",
  generating:
    "Scribe is writing prompts. Forge is rendering through gpt-image-1. 60–180 seconds.",
  ready: "Your 3 brand visuals are ready below.",
  failed: "The render failed. Try a different brief.",
};

export function PhotoshootGenerator() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [vibe, setVibe] = useState("");
  const [colorPalette, setColorPalette] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const [job, setJob] = useState<JobStatus | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollStartRef = useRef<number>(0);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const renderPanelRef = useRef<HTMLDivElement>(null);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const pollOnce = useCallback(
    async (jobId: string) => {
      try {
        const res = await fetch(`/api/photoshoot/status/${jobId}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          setPollError(`status check failed (${res.status})`);
          throw new Error(`status ${res.status}`);
        }
        const data = (await res.json()) as JobStatus;
        setJob(data);
        setPollError(null);
        if (data.status === "ready" || data.status === "failed") {
          stopPolling();
          return;
        }
        const elapsed = Date.now() - pollStartRef.current;
        if (elapsed > MAX_POLL_MS) {
          stopPolling();
          setError(
            "This is taking longer than expected. Reload in a minute to check again.",
          );
          return;
        }
        pollTimerRef.current = setTimeout(
          () => void pollOnce(jobId),
          POLL_INTERVAL_MS,
        );
      } catch {
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

    if (!name.trim() || name.trim().length < 2) {
      setError("Please include your name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please include a valid email.");
      return;
    }
    if (!brandName.trim() || !brandDescription.trim()) {
      setError("Brand name and description are required.");
      return;
    }

    setSubmitting(true);
    stopPolling();
    setJob({ jobId: "starting", status: "pending", images: [] });
    requestAnimationFrame(() => {
      renderPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });

    try {
      const res = await fetch("/api/photoshoot/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          brand_name: brandName.trim(),
          brand_description: brandDescription.trim(),
          industry: industry.trim() || undefined,
          vibe: vibe.trim() || undefined,
          color_palette: colorPalette.trim() || undefined,
          reference_url: referenceUrl.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { jobId?: string; error?: string };
      if (!res.ok || !data.jobId) {
        throw new Error(data.error ?? `request failed (${res.status})`);
      }
      const jobId = data.jobId;
      setJob({ jobId, status: "pending", images: [] });
      pollStartRef.current = Date.now();
      pollTimerRef.current = setTimeout(
        () => void pollOnce(jobId),
        POLL_INTERVAL_MS,
      );
    } catch (err) {
      setJob(null);
      setError(err instanceof Error ? err.message : "Couldn't start render");
      requestAnimationFrame(() => {
        errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    } finally {
      setSubmitting(false);
    }
  }

  const showForm = !job || job.status === "failed";
  const isRendering =
    job && (job.status === "pending" || job.status === "generating");

  return (
    <div className="space-y-6">
      {showForm && (
        <form onSubmit={submit} className="card rounded-xl p-6 sm:p-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="ps-name"
                className="block text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2"
              >
                Your name *
              </label>
              <input
                id="ps-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Chen"
                required
                autoComplete="name"
                className="w-full bg-[var(--color-ink)] border border-white/15 rounded-md px-3 py-2 text-base sm:text-sm text-[var(--color-paper)] placeholder:text-[var(--color-mute)] focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]/50"
                style={{ fontSize: "16px" }}
              />
            </div>
            <div>
              <label
                htmlFor="ps-email"
                className="block text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2"
              >
                Email *
              </label>
              <input
                id="ps-email"
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
            </div>
          </div>

          <div>
            <label
              htmlFor="ps-brand"
              className="block text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2"
            >
              Brand or company name *
            </label>
            <input
              id="ps-brand"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Acme Coffee Roasters"
              required
              className="w-full bg-[var(--color-ink)] border border-white/15 rounded-md px-3 py-2 text-base sm:text-sm text-[var(--color-paper)] placeholder:text-[var(--color-mute)] focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]/50"
              style={{ fontSize: "16px" }}
            />
          </div>

          <div>
            <label
              htmlFor="ps-description"
              className="block text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2"
            >
              What does your brand do? (2–4 sentences) *
            </label>
            <textarea
              id="ps-description"
              value={brandDescription}
              onChange={(e) => setBrandDescription(e.target.value)}
              placeholder="We roast small-batch single-origin coffee in Brooklyn. Direct trade, focused on Ethiopian and Colombian beans. Our customers are weekend brewers who care about origin stories."
              rows={4}
              required
              className="w-full bg-[var(--color-ink)] border border-white/15 rounded-md px-3 py-2 text-base sm:text-sm text-[var(--color-paper)] placeholder:text-[var(--color-mute)] focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]/50"
              style={{ fontSize: "16px" }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="ps-industry"
                className="block text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2"
              >
                Industry
              </label>
              <select
                id="ps-industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-[var(--color-ink)] border border-white/15 rounded-md px-3 py-2 text-base sm:text-sm text-[var(--color-paper)] focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]/50"
                style={{ fontSize: "16px" }}
              >
                <option value="">Choose one…</option>
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="ps-vibe"
                className="block text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2"
              >
                Aesthetic / vibe
              </label>
              <select
                id="ps-vibe"
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
                className="w-full bg-[var(--color-ink)] border border-white/15 rounded-md px-3 py-2 text-base sm:text-sm text-[var(--color-paper)] focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]/50"
                style={{ fontSize: "16px" }}
              >
                <option value="">Choose one…</option>
                {VIBES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="ps-color"
                className="block text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2"
              >
                Color preferences (optional)
              </label>
              <input
                id="ps-color"
                value={colorPalette}
                onChange={(e) => setColorPalette(e.target.value)}
                placeholder="deep green + cream + brass"
                className="w-full bg-[var(--color-ink)] border border-white/15 rounded-md px-3 py-2 text-base sm:text-sm text-[var(--color-paper)] placeholder:text-[var(--color-mute)] focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]/50"
                style={{ fontSize: "16px" }}
              />
            </div>
            <div>
              <label
                htmlFor="ps-ref"
                className="block text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2"
              >
                Reference URL (optional)
              </label>
              <input
                id="ps-ref"
                value={referenceUrl}
                onChange={(e) => setReferenceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[var(--color-ink)] border border-white/15 rounded-md px-3 py-2 text-base sm:text-sm text-[var(--color-paper)] placeholder:text-[var(--color-mute)] focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]/50"
                style={{ fontSize: "16px" }}
              />
            </div>
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
            {submitting ? "Starting…" : "Generate my free 3-image preview →"}
          </button>

          <p className="text-xs mono text-[var(--color-mute)] text-center">
            Renders right here on the page. No card. $49 unlocks the full
            10-image pack (emailed).
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
          {job.images.length > 0 && (
            <p className="text-xs mono text-[var(--color-mute)] mt-3">
              {job.images.length} of 3 ready · streaming in as they finish.
            </p>
          )}
          {job.images.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
              {job.images.map((img) => (
                <PreviewImage key={img.mode} img={img} />
              ))}
            </div>
          )}
          {pollError && (
            <p className="text-xs mono text-[var(--color-rust)] mt-3 bg-[var(--color-rust)]/10 rounded px-2 py-1">
              Status check: {pollError}
            </p>
          )}
        </div>
      )}

      {job && job.status === "ready" && (
        <div className="space-y-5">
          <div className="card rounded-xl p-4 sm:p-5 ring-2 ring-[var(--color-gold)]">
            <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-3">
              Your 3-image brand preview · ready
            </p>
            <div className="grid grid-cols-1 gap-4">
              {job.images.map((img) => (
                <PreviewImage key={img.mode} img={img} />
              ))}
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
              Like what you see? Unlock the full pack.
            </p>
            <h3 className="text-xl font-semibold mb-2">
              Brand Aesthetic Pack — $49
            </h3>
            <p className="text-sm text-[var(--color-paper)]/85 mb-5 leading-relaxed">
              10 polished visuals across all 7 modes — hero banner, social cards
              (3 variations), moodboard, Meta + TikTok ad creative, brand
              pattern, vertical poster. All 2K PNG, emailed in minutes.
            </p>
            <a
              href="#pack"
              className="inline-block px-6 py-3 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] font-medium hover:opacity-90 transition"
            >
              Buy the full pack →
            </a>
          </div>

          <button
            onClick={() => {
              setJob(null);
              setError(null);
              setPollError(null);
              stopPolling();
            }}
            className="w-full text-sm text-[var(--color-paper)]/70 hover:text-[var(--color-gold)] underline underline-offset-4 transition"
          >
            ← Try another brief
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
              "Something went sideways. Try a slightly different brief."}
          </p>
          <button
            onClick={() => {
              setJob(null);
              setError(null);
              setPollError(null);
              stopPolling();
            }}
            className="mt-4 text-sm text-[var(--color-paper)]/70 hover:text-[var(--color-gold)] underline underline-offset-4 transition"
          >
            ← Try another brief
          </button>
        </div>
      )}
    </div>
  );
}

function PreviewImage({ img }: { img: PhotoshootImage }) {
  return (
    <div className="rounded-md overflow-hidden border border-white/10 bg-black/30">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img.url}
        alt={`${img.modeLabel} brand visual`}
        className="block w-full h-auto"
        loading="lazy"
      />
      <div className="px-3 py-2 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[10px] mono uppercase tracking-widest text-[var(--color-gold)]">
          {img.modeLabel}
        </span>
        <span className="text-[10px] mono text-[var(--color-mute)]">
          {img.size}
        </span>
      </div>
      <div className="px-3 pb-3 flex flex-wrap gap-2">
        <a
          href={img.url}
          download={`${img.mode}.png`}
          className="text-[10px] mono uppercase tracking-widest text-[var(--color-paper)]/80 hover:text-[var(--color-gold)] underline underline-offset-2"
        >
          Download PNG
        </a>
      </div>
    </div>
  );
}
