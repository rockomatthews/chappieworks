"use client";

import { useEffect, useRef, useState } from "react";
import { EDIT_STATUS_LABELS, type EditStatus, type SiteRecord } from "../../lib/sites";

const STATUS_CLASS: Record<EditStatus, string> = {
  received:
    "text-[var(--color-paper)]/80 border-white/20 bg-white/5",
  in_progress:
    "text-[var(--color-gold)] border-[var(--color-gold)]/60 bg-[var(--color-gold)]/10",
  shipped:
    "text-[var(--color-rust)] border-[var(--color-rust)]/50 bg-[var(--color-rust)]/10",
  needs_info:
    "text-[var(--color-paper)]/85 border-white/30 bg-white/5",
};

function timeLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SiteDashboard({ initialSite }: { initialSite: SiteRecord }) {
  const [site, setSite] = useState<SiteRecord>(initialSite);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [site.messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/site/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: site.slug, body: trimmed }),
      });
      const data = (await res.json()) as
        | { ok: true; site: SiteRecord }
        | { ok: false; error: string };
      if (!data.ok) {
        setError(data.error);
      } else {
        setSite(data.site);
        setBody("");
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function signOut() {
    await fetch("/api/site/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: site.slug }),
    });
    location.reload();
  }

  return (
    <div className="space-y-5">
      <div className="card rounded-xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] mono text-[var(--color-mute)] uppercase tracking-widest mb-1">
            Status
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded text-xs mono uppercase tracking-widest border ${STATUS_CLASS[site.status]}`}
          >
            {EDIT_STATUS_LABELS[site.status]}
          </span>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="text-xs mono text-[var(--color-mute)] hover:text-[var(--color-gold)]"
        >
          Sign out
        </button>
      </div>

      <div
        ref={threadRef}
        className="card rounded-xl p-4 sm:p-6 max-h-[60vh] overflow-y-auto flex flex-col gap-3"
      >
        {site.messages.map((m) => {
          const isCustomer = m.from === "customer";
          const isSystem = m.from === "system";
          if (isSystem) {
            return (
              <div
                key={m.id}
                className="text-center text-[10px] mono uppercase tracking-widest text-[var(--color-mute)] my-2"
              >
                {m.body} · {timeLabel(m.at)}
              </div>
            );
          }
          return (
            <div
              key={m.id}
              className={`flex flex-col gap-1 ${isCustomer ? "items-end" : "items-start"}`}
            >
              <div className="text-[10px] mono uppercase tracking-widest text-[var(--color-mute)]">
                {isCustomer ? "You" : "The studio"} · {timeLabel(m.at)}
              </div>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  isCustomer
                    ? "bg-[var(--color-gold)]/15 border border-[var(--color-gold)]/30 rounded-tr-sm"
                    : "bg-white/5 border border-white/10 rounded-tl-sm"
                }`}
              >
                {m.body}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={send} className="card rounded-xl p-4 sm:p-5">
        <label htmlFor="edit-request" className="sr-only">
          Request an edit
        </label>
        <textarea
          id="edit-request"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              const form = e.currentTarget.form;
              if (form && body.trim()) form.requestSubmit();
            }
          }}
          rows={3}
          placeholder="Describe the change you want — new copy, swapped colors, a fresh page. The more specific, the faster it ships."
          className="w-full rounded-md border border-white/15 bg-black/30 px-4 py-3 text-sm focus:border-[var(--color-gold)] focus:outline-none resize-y"
          disabled={submitting}
        />
        <div className="flex items-center justify-between gap-3 mt-3">
          <p className="text-[10px] mono text-[var(--color-mute)]">
            Edits land within 24 hours. Cmd/Ctrl+Enter to send.
          </p>
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="rounded-md bg-[var(--color-gold)] text-black px-4 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Sending…" : "Send"}
          </button>
        </div>
        {error ? (
          <p className="mt-3 text-sm text-[var(--color-rust)]">{error}</p>
        ) : null}
      </form>
    </div>
  );
}
