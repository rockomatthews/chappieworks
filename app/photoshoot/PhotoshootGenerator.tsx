"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  StripeCheckoutModal,
  canEmbedCheckout,
} from "../components/StripeCheckoutModal";

type Img = { mode: string; modeLabel: string; size: string; url: string };
type Status = {
  jobId: string;
  status: "pending" | "generating" | "ready" | "failed";
  images: Img[];
  failureReason?: string;
  paletteHex?: string[];
  fontPairing?: { heading: string; body: string; rationale?: string };
  paid?: boolean;
  packageStatus?: "idle" | "generating" | "ready" | "failed";
  packageImages?: Img[];
  packageFailureReason?: string;
};

function ImageCard({ img }: { img: Img }) {
  const ratio =
    img.size === "1536x1024"
      ? "aspect-[3/2]"
      : img.size === "1024x1536"
        ? "aspect-[2/3]"
        : "aspect-square";
  return (
    <figure className="card rounded-xl overflow-hidden">
      <div className={`relative ${ratio} bg-black/30`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.url}
          alt={img.modeLabel}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      <figcaption className="flex items-center justify-between px-3 py-2 text-xs">
        <span className="text-[var(--color-paper)]/85">{img.modeLabel}</span>
        <a
          href={img.url}
          download
          target="_blank"
          rel="noreferrer"
          className="mono text-[var(--color-gold)] hover:underline"
        >
          Download ↓
        </a>
      </figcaption>
    </figure>
  );
}

export function PhotoshootGenerator() {
  const [brandName, setBrandName] = useState("");
  const [desc, setDesc] = useState("");
  const [industry, setIndustry] = useState("");
  const [vibe, setVibe] = useState("");
  const [colors, setColors] = useState("");
  const [email, setEmail] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);

  const [jobId, setJobId] = useState<string | null>(null);
  const [st, setSt] = useState<Status | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resume a paid job after Stripe's return_url redirect (?job=…&paid=1).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const j = params.get("job");
    if (j && params.get("paid") === "1") setJobId(j);
  }, []);

  const poll = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/photoshoot/status/${id}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as Status;
        setSt(data);
        const stillWorking =
          data.status === "pending" ||
          data.status === "generating" ||
          data.packageStatus === "generating";
        if (stillWorking) {
          pollRef.current = setTimeout(() => poll(id), 2500);
        }
      } else {
        pollRef.current = setTimeout(() => poll(id), 3000);
      }
    } catch {
      pollRef.current = setTimeout(() => poll(id), 3500);
    }
  }, []);

  useEffect(() => {
    if (!jobId) return;
    poll(jobId);
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [jobId, poll]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!brandName.trim() || !desc.trim()) {
      setError("Brand name and a short description are required.");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("brand_name", brandName);
      fd.set("brand_description", desc);
      fd.set("industry", industry);
      fd.set("vibe", vibe);
      fd.set("color_palette", colors);
      fd.set("email", email);
      if (logo) fd.set("logo", logo);
      for (const p of photos) fd.append("photos", p);
      const res = await fetch("/api/photoshoot/generate", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as { jobId?: string; error?: string };
      if (!res.ok || !data.jobId) throw new Error(data.error ?? "generation failed");
      setJobId(data.jobId);
      setSt({ jobId: data.jobId, status: "pending", images: [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function unlock() {
    if (!jobId) return;
    setError(null);
    setBuying(true);
    try {
      const embedded = canEmbedCheckout();
      const res = await fetch(`/api/photoshoot/checkout/${jobId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embedded, email }),
      });
      const data = (await res.json()) as {
        clientSecret?: string;
        url?: string;
        bypassed?: boolean;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "checkout failed");
      if (data.bypassed) {
        poll(jobId);
        return;
      }
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else if (data.url) {
        window.location.href = data.url; // redirect fallback
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "checkout failed");
    } finally {
      setBuying(false);
    }
  }

  const inputCls =
    "w-full rounded-md bg-black/30 border border-white/12 px-3 py-2.5 text-sm focus:border-[var(--color-gold)] outline-none";

  // 1) Initial form
  if (!jobId) {
    return (
      <form onSubmit={submit} className="card rounded-xl p-6 sm:p-8 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-xs mono text-[var(--color-mute)]">Brand name *</span>
            <input className={inputCls} value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Acme Roastery" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs mono text-[var(--color-mute)]">Industry</span>
            <input className={inputCls} value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Specialty coffee" />
          </label>
        </div>
        <label className="block space-y-1.5">
          <span className="text-xs mono text-[var(--color-mute)]">What you do (2–4 sentences) *</span>
          <textarea className={`${inputCls} min-h-[90px]`} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Small-batch coffee roaster. Warm, earthy, craft-forward. We sell direct and to indie cafés." />
        </label>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-xs mono text-[var(--color-mute)]">Aesthetic / vibe</span>
            <input className={inputCls} value={vibe} onChange={(e) => setVibe(e.target.value)} placeholder="Warm, rustic, premium" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs mono text-[var(--color-mute)]">Colors (optional)</span>
            <input className={inputCls} value={colors} onChange={(e) => setColors(e.target.value)} placeholder="terracotta, cream, espresso" />
          </label>
        </div>

        <div className="rounded-lg border border-dashed border-white/15 p-4 space-y-3">
          <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest">
            Upload your brand assets — this is what makes it yours
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs text-[var(--color-paper)]/80">Logo (PNG/JPG/WebP)</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" className="block w-full text-xs text-[var(--color-mute)] file:mr-3 file:rounded file:border-0 file:bg-[var(--color-gold)] file:px-3 file:py-1.5 file:text-black file:text-xs" onChange={(e) => setLogo(e.target.files?.[0] ?? null)} />
              {logo && <span className="text-[11px] text-[var(--color-mute)]">{logo.name}</span>}
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-[var(--color-paper)]/80">Existing photos (up to 5)</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="block w-full text-xs text-[var(--color-mute)] file:mr-3 file:rounded file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-white file:text-xs" onChange={(e) => setPhotos(Array.from(e.target.files ?? []).slice(0, 5))} />
              {photos.length > 0 && <span className="text-[11px] text-[var(--color-mute)]">{photos.length} photo(s)</span>}
            </label>
          </div>
          <p className="text-[11px] text-[var(--color-mute)]">
            We read your real colors + style off these and use them as references — so the visuals look like <em>your</em> brand, not generic AI. Optional, but the output is dramatically better with them.
          </p>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs mono text-[var(--color-mute)]">Email (for your package + receipt)</span>
          <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@brand.com" />
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={submitting} className="w-full rounded-md bg-[var(--color-gold)] text-black font-semibold py-3 text-sm hover:opacity-90 disabled:opacity-60">
          {submitting ? "Starting…" : "Generate 3 free brand visuals →"}
        </button>
        <p className="text-[11px] text-center text-[var(--color-mute)]">Free · no card · renders right here in minutes</p>
      </form>
    );
  }

  // 2) Working / results
  const previewReady = st?.status === "ready";
  const previewFailed = st?.status === "failed";
  const pkg = st?.packageStatus;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Your 3 free brand visuals</h3>
          {st?.paletteHex && st.paletteHex.length > 0 && (
            <div className="flex gap-1.5" title="Palette read from your assets">
              {st.paletteHex.slice(0, 6).map((h) => (
                <span key={h} className="w-5 h-5 rounded-full border border-white/20" style={{ background: h }} />
              ))}
            </div>
          )}
        </div>

        {!previewReady && !previewFailed && (
          <div className="card rounded-xl p-8 text-center">
            <div className="inline-block w-8 h-8 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[var(--color-mute)] mt-4">
              Reading your brand DNA and rendering 3 on-brand visuals… typically under 3 minutes.
            </p>
            <p className="text-xs mono text-[var(--color-mute)] mt-1">{st?.images?.length ?? 0}/3 done</p>
          </div>
        )}
        {previewFailed && (
          <div className="card rounded-xl p-6 text-sm text-red-400">
            {st?.failureReason ?? "Generation failed."} — refresh and try again, no charge.
          </div>
        )}

        {(st?.images?.length ?? 0) > 0 && (
          <div className="grid sm:grid-cols-3 gap-4">
            {st!.images.map((img) => (
              <ImageCard key={img.mode} img={img} />
            ))}
          </div>
        )}
      </section>

      {previewReady && (
        <section className="space-y-4">
          {!st?.paid ? (
            <div className="card rounded-xl p-6 sm:p-8 border-[var(--color-gold)]/40">
              <h3 className="text-xl font-semibold mb-2">Love them? Get the Full Brand Identity Package — $49</h3>
              <p className="text-sm text-[var(--color-paper)]/85 mb-4">Built from your same assets, cohesive and ready to ship:</p>
              <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-[var(--color-paper)]/90 mb-5">
                {["Brand identity document — colors, fonts, voice", "Logo treatment on-brand", "Color palette board", "Social avatar + banner", "Ad creative + brand pattern", "All commercial rights, yours"].map((x) => (
                  <li key={x} className="flex gap-2"><span className="text-[var(--color-gold)]">▸</span>{x}</li>
                ))}
              </ul>
              {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
              <button onClick={unlock} disabled={buying} className="w-full sm:w-auto rounded-md bg-[var(--color-gold)] text-black font-semibold px-8 py-3 text-sm hover:opacity-90 disabled:opacity-60">
                {buying ? "Opening checkout…" : "Unlock the full package — $49"}
              </button>
              <p className="text-[11px] text-[var(--color-mute)] mt-2">Secure checkout right here on the page. No redirect.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Your Full Brand Identity Package</h3>
              {pkg === "generating" && (
                <div className="card rounded-xl p-8 text-center">
                  <div className="inline-block w-8 h-8 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-[var(--color-mute)] mt-4">
                    Payment received — generating your package ({st?.packageImages?.length ?? 0}/6). Hang tight, a couple minutes.
                  </p>
                </div>
              )}
              {pkg === "failed" && (
                <div className="card rounded-xl p-6 text-sm text-red-400">
                  {st?.packageFailureReason ?? "Package generation hit a snag."} — we&rsquo;ll retry; email us if it doesn&rsquo;t land.
                </div>
              )}
              {(st?.packageImages?.length ?? 0) > 0 && (
                <div className="grid sm:grid-cols-3 gap-4">
                  {st!.packageImages!.map((img) => (
                    <ImageCard key={img.mode} img={img} />
                  ))}
                </div>
              )}
              {(st?.fontPairing || (st?.packageImages?.length ?? 0) > 0) && jobId && (
                <a
                  href={`/photoshoot/brand/${jobId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-[var(--color-gold)] text-black font-semibold px-6 py-3 text-sm hover:opacity-90"
                >
                  📄 Open your Brand Identity Document →
                </a>
              )}
              {pkg === "ready" && (
                <p className="text-sm text-[var(--color-gold)]">✓ Package complete — download each image above, and your brand document is linked.</p>
              )}
            </div>
          )}
        </section>
      )}

      {clientSecret && (
        <StripeCheckoutModal
          clientSecret={clientSecret}
          onClose={() => {
            setClientSecret(null);
            if (jobId) poll(jobId);
          }}
        />
      )}
    </div>
  );
}
