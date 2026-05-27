"use client";

import { useState } from "react";
import Link from "next/link";

type Result = { slug: string };

export function CreateSiteForm() {
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [brief, setBrief] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/studio/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerEmail, ownerName, businessName, brief, liveUrl }),
      });
      const data = (await res.json()) as
        | { ok: true; slug: string }
        | { ok: false; error: string };
      if (!data.ok) {
        setError(data.error);
      } else {
        setResult({ slug: data.slug });
        setOwnerEmail("");
        setOwnerName("");
        setBusinessName("");
        setBrief("");
        setLiveUrl("");
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-white/15 bg-transparent px-3 py-2 text-sm text-[var(--color-paper)] placeholder:text-[var(--color-mute)] focus:outline-none focus:border-[var(--color-gold)]/60 transition";
  const labelClass = "block text-[10px] mono uppercase tracking-widest text-[var(--color-mute)] mb-1";

  return (
    <div className="mt-5 border-t border-white/10 pt-5">
      <h4 className="text-sm font-semibold text-[var(--color-gold)] mb-3">
        Create site — bypass intake
      </h4>

      {result ? (
        <div className="rounded-lg border border-[var(--color-gold)]/40 bg-[var(--color-gold)]/5 p-4 text-sm">
          <p className="text-[var(--color-gold)] font-semibold mb-2">Site created.</p>
          <p className="text-[var(--color-paper)]/80 mono text-xs mb-3">
            slug: {result.slug}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/studio/site-edits/${result.slug}`}
              className="text-xs mono text-[var(--color-gold)] hover:underline"
            >
              Operator view →
            </Link>
            <span className="text-[var(--color-mute)] text-xs">·</span>
            <Link
              href={`/site/${result.slug}`}
              className="text-xs mono text-[var(--color-paper)]/70 hover:text-[var(--color-gold)] hover:underline"
            >
              Customer dashboard →
            </Link>
          </div>
          <button
            onClick={() => setResult(null)}
            className="mt-3 text-[10px] mono text-[var(--color-mute)] hover:text-[var(--color-paper)] underline"
          >
            Create another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Owner email *</label>
              <input
                type="email"
                required
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="customer@example.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Owner name *</label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Jane Smith"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Business name *</label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Acme Co"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Live URL (optional)</label>
            <input
              type="url"
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
              placeholder="https://acme.com"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Brief (optional)</label>
            <textarea
              rows={3}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="What do they need built / fixed?"
              className={`${inputClass} resize-none`}
            />
          </div>
          {error && (
            <p className="text-xs text-red-400 mono">{error}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] text-sm font-medium py-2 hover:opacity-90 transition disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create site"}
          </button>
        </form>
      )}
    </div>
  );
}
