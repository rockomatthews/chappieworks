"use client";

import { useState } from "react";

export function CreateSiteForm() {
  const [open, setOpen] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [brief, setBrief] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/studio/site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerName,
          ownerEmail,
          businessName,
          liveUrl: liveUrl || undefined,
          brief: brief || undefined,
        }),
      });
      const data = (await res.json()) as
        | { ok: true; slug: string }
        | { ok: false; error: string };
      if (!data.ok) {
        setError(data.error);
      } else {
        setCreatedSlug(data.slug);
        setOwnerName("");
        setOwnerEmail("");
        setBusinessName("");
        setLiveUrl("");
        setBrief("");
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setCreatedSlug(null);
        }}
        className="text-sm mono text-[var(--color-gold)] hover:underline"
      >
        + Provision new site
      </button>
    );
  }

  return (
    <div className="card rounded-xl p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm mono uppercase tracking-widest text-[var(--color-gold)]">
          Provision site
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs mono text-[var(--color-mute)] hover:text-white"
        >
          close
        </button>
      </div>
      {createdSlug ? (
        <div className="text-sm space-y-2">
          <p>Provisioned. Send this URL to the customer:</p>
          <code className="block bg-black/40 rounded px-3 py-2 text-xs mono break-all">
            https://chappieworks.com/site/{createdSlug}
          </code>
          <button
            type="button"
            onClick={() => setCreatedSlug(null)}
            className="text-xs mono text-[var(--color-gold)] hover:underline mt-2"
          >
            + provision another
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            required
            placeholder="Owner name"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            className="rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm focus:border-[var(--color-gold)] focus:outline-none"
          />
          <input
            required
            type="email"
            placeholder="Owner email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            className="rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm focus:border-[var(--color-gold)] focus:outline-none"
          />
          <input
            required
            placeholder="Business name (shown on dashboard)"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm focus:border-[var(--color-gold)] focus:outline-none sm:col-span-2"
          />
          <input
            type="url"
            placeholder="Live URL (optional)"
            value={liveUrl}
            onChange={(e) => setLiveUrl(e.target.value)}
            className="rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm focus:border-[var(--color-gold)] focus:outline-none sm:col-span-2"
          />
          <textarea
            placeholder="Brief summary (optional, visible to studio only)"
            rows={2}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            className="rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm focus:border-[var(--color-gold)] focus:outline-none sm:col-span-2 resize-y"
          />
          <button
            type="submit"
            disabled={submitting || !ownerName || !ownerEmail || !businessName}
            className="rounded-md bg-[var(--color-gold)] text-black px-4 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed sm:col-span-2"
          >
            {submitting ? "Creating…" : "Create dashboard"}
          </button>
          {error ? (
            <p className="text-sm text-[var(--color-rust)] sm:col-span-2">{error}</p>
          ) : null}
        </form>
      )}
    </div>
  );
}
