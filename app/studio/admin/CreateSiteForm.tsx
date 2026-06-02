"use client";

import { useState } from "react";

type Result = { slug: string; dashboardUrl: string; welcomed: boolean } | null;

export function CreateSiteForm() {
  const [fields, setFields] = useState({
    ownerEmail: "",
    ownerName: "",
    businessName: "",
    brief: "",
    liveUrl: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result>(null);

  function set(key: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFields((f) => ({ ...f, [key]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/studio/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerEmail: fields.ownerEmail.trim(),
          ownerName: fields.ownerName.trim(),
          businessName: fields.businessName.trim(),
          brief: fields.brief.trim() || undefined,
          liveUrl: fields.liveUrl.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { ok: boolean; slug?: string; welcomed?: boolean; error?: string };
      if (!data.ok || !data.slug) {
        setError(data.error ?? "Server error");
      } else {
        setResult({
          slug: data.slug,
          dashboardUrl: `https://chappieworks.com/site/${data.slug}`,
          welcomed: data.welcomed ?? false,
        });
        setFields({ ownerEmail: "", ownerName: "", businessName: "", brief: "", liveUrl: "" });
      }
    } catch {
      setError("Network error — is the server running?");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full rounded-md border border-white/15 bg-black/30 px-4 py-3 text-sm mono focus:border-[var(--color-gold)] focus:outline-none";
  const labelCls = "block text-xs mono text-[var(--color-mute)] uppercase tracking-widest mb-1.5";

  return (
    <div className="space-y-6">
      {result ? (
        <div className="card rounded-xl p-6 sm:p-8 ring-1 ring-[var(--color-gold)]/40">
          <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2">
            Site created
          </p>
          <p className="text-sm text-[var(--color-paper)]/85 mb-4">
            {result.welcomed
              ? "Welcome email with sign-in link sent to the customer."
              : "Welcome email could not be sent — copy the dashboard URL below and forward it manually."}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <code className="text-sm mono bg-black/40 border border-white/10 rounded px-3 py-2 text-[var(--color-gold)] select-all break-all">
              {result.dashboardUrl}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(result.dashboardUrl)}
              className="text-xs mono px-3 py-2 rounded border border-white/20 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition"
            >
              Copy
            </button>
          </div>
          <button
            onClick={() => setResult(null)}
            className="mt-5 text-xs mono text-[var(--color-mute)] hover:text-[var(--color-gold)] transition"
          >
            ← Create another
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="card rounded-xl p-6 sm:p-8 space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Owner email *</label>
              <input
                type="email"
                required
                value={fields.ownerEmail}
                onChange={set("ownerEmail")}
                placeholder="customer@example.com"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Owner name *</label>
              <input
                type="text"
                required
                value={fields.ownerName}
                onChange={set("ownerName")}
                placeholder="Jane Smith"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Business name *</label>
            <input
              type="text"
              required
              value={fields.businessName}
              onChange={set("businessName")}
              placeholder="Acme Co."
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Brief (optional)</label>
            <textarea
              rows={3}
              value={fields.brief}
              onChange={set("brief")}
              placeholder="What's the site about? What do they sell? Any specific asks?"
              className={`${inputCls} resize-none`}
            />
          </div>

          <div>
            <label className={labelCls}>Live URL (optional — if they have an existing site)</label>
            <input
              type="url"
              value={fields.liveUrl}
              onChange={set("liveUrl")}
              placeholder="https://existingsite.com"
              className={inputCls}
            />
          </div>

          {error ? (
            <p className="text-sm text-[var(--color-rust)]">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-[var(--color-gold)] text-black px-4 py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
          >
            {submitting ? "Creating…" : "Create site + dashboard"}
          </button>

          <p className="text-xs mono text-[var(--color-mute)]">
            Creates a private dashboard at /site/&#123;slug&#125;. No Stripe charge — admin bypass.
            The customer signs in via Supabase magic link.
          </p>
        </form>
      )}
    </div>
  );
}
