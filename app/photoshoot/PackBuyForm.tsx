"use client";

import { useState } from "react";

const INDUSTRY_OPTIONS = [
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

const VIBE_OPTIONS = [
  "Modern minimal — clean, white space, refined",
  "Bold + maximal — saturated, playful, energetic",
  "Luxe / premium — moody, deep tones, cinematic",
  "Earthy / organic — natural, grounded, warm",
  "Tech / editorial — futuristic, sharp, monochrome",
  "Retro / nostalgic — film grain, faded, throwback",
  "Surreal / conceptual — dreamlike, abstract",
];

export function PackBuyForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [vibe, setVibe] = useState("");
  const [palette, setPalette] = useState("");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError("Please include your name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please include a valid email.");
      return;
    }
    if (!brand || !description || !industry || !vibe) {
      setError("Brand, description, industry, and vibe are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/photoshoot/pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          brand_name: brand,
          brand_description: description,
          industry,
          vibe,
          color_palette: palette || undefined,
          reference_url: reference || undefined,
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? `request failed (${res.status})`);
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "couldn't start checkout");
      setSubmitting(false);
    }
  }

  const fieldClass =
    "w-full bg-[var(--color-ink)] border border-white/15 rounded-md px-3 py-2 text-base sm:text-sm text-[var(--color-paper)] placeholder:text-[var(--color-mute)] focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]/50";
  const labelClass =
    "block text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2";

  return (
    <form
      onSubmit={submit}
      className="card rounded-xl p-6 sm:p-8 space-y-5"
      style={{
        background:
          "linear-gradient(135deg, rgba(201,164,55,0.08), rgba(201,164,55,0.02))",
        border: "1px solid rgba(201,164,55,0.45)",
      }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest">
          Full pack · skip the preview
        </p>
        <p className="text-xs mono text-[var(--color-mute)]">
          10 visuals · 7 modes · 2K PNG
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="pack-name" className={labelClass}>
            Your name *
          </label>
          <input
            id="pack-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={fieldClass}
            style={{ fontSize: "16px" }}
          />
        </div>
        <div>
          <label htmlFor="pack-email" className={labelClass}>
            Email *
          </label>
          <input
            id="pack-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            inputMode="email"
            placeholder="you@brand.com"
            className={fieldClass}
            style={{ fontSize: "16px" }}
          />
        </div>
      </div>

      <div>
        <label htmlFor="pack-brand" className={labelClass}>
          Brand or company name *
        </label>
        <input
          id="pack-brand"
          type="text"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          required
          placeholder="Acme Coffee Roasters"
          className={fieldClass}
          style={{ fontSize: "16px" }}
        />
      </div>

      <div>
        <label htmlFor="pack-desc" className={labelClass}>
          What does your brand do? (2–4 sentences) *
        </label>
        <textarea
          id="pack-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          required
          placeholder="We roast small-batch single-origin coffee in Brooklyn. Direct trade, Ethiopian + Colombian focus. Our customers are weekend brewers who care about origin stories."
          className={fieldClass}
          style={{ fontSize: "16px" }}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="pack-industry" className={labelClass}>
            Industry *
          </label>
          <select
            id="pack-industry"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            required
            className={fieldClass}
            style={{ fontSize: "16px" }}
          >
            <option value="">Select…</option>
            {INDUSTRY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pack-vibe" className={labelClass}>
            Aesthetic / vibe *
          </label>
          <select
            id="pack-vibe"
            value={vibe}
            onChange={(e) => setVibe(e.target.value)}
            required
            className={fieldClass}
            style={{ fontSize: "16px" }}
          >
            <option value="">Select…</option>
            {VIBE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="pack-palette" className={labelClass}>
          Color preferences (optional)
        </label>
        <input
          id="pack-palette"
          type="text"
          value={palette}
          onChange={(e) => setPalette(e.target.value)}
          placeholder="deep green + cream + brass · or any hex codes you love"
          className={fieldClass}
          style={{ fontSize: "16px" }}
        />
      </div>

      <div>
        <label htmlFor="pack-reference" className={labelClass}>
          Reference site or Pinterest board (optional)
        </label>
        <input
          id="pack-reference"
          type="url"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="https://…"
          className={fieldClass}
          style={{ fontSize: "16px" }}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="text-sm text-[var(--color-rust)] bg-[var(--color-rust)]/10 border border-[var(--color-rust)]/40 rounded-md px-3 py-2"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full px-6 py-3 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Opening checkout…" : "Buy the Brand Aesthetic Pack — $49 →"}
      </button>

      <p className="text-xs mono text-[var(--color-mute)] text-center">
        Secure checkout via Stripe. Apple Pay / Google Pay supported. 10 PNGs
        land in your inbox in minutes.
      </p>
    </form>
  );
}
