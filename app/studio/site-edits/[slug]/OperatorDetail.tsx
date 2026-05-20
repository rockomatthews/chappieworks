"use client";

import { useEffect, useRef, useState } from "react";
import {
  EDIT_STATUS_LABELS,
  type EditStatus,
  type SiteRecord,
} from "../../../lib/sites";

const STATUSES: EditStatus[] = ["received", "in_progress", "shipped", "needs_info"];

const STATUS_CLASS: Record<EditStatus, string> = {
  received: "text-[var(--color-paper)]/80 border-white/20 bg-white/5",
  in_progress:
    "text-[var(--color-gold)] border-[var(--color-gold)]/60 bg-[var(--color-gold)]/10",
  shipped:
    "text-[var(--color-rust)] border-[var(--color-rust)]/50 bg-[var(--color-rust)]/10",
  needs_info: "text-[var(--color-paper)]/85 border-white/30 bg-white/5",
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

export function OperatorDetail({ initialSite }: { initialSite: SiteRecord }) {
  const [site, setSite] = useState<SiteRecord>(initialSite);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<EditStatus>(initialSite.status);
  const [liveUrl, setLiveUrl] = useState(initialSite.liveUrl ?? "");
  const [savingMeta, setSavingMeta] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [site.messages.length]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed && status === site.status) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/studio/site", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: site.slug,
          body: trimmed || undefined,
          status: status !== site.status ? status : undefined,
        }),
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
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  async function saveLiveUrl(e: React.FormEvent) {
    e.preventDefault();
    setSavingMeta(true);
    setError(null);
    try {
      const res = await fetch("/api/studio/site", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: site.slug, liveUrl }),
      });
      const data = (await res.json()) as
        | { ok: true; site: SiteRecord }
        | { ok: false; error: string };
      if (!data.ok) setError(data.error);
      else setSite(data.site);
    } catch {
      setError("Network error");
    } finally {
      setSavingMeta(false);
    }
  }

  const customerUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/site/${site.slug}`
      : `/site/${site.slug}`;

  return (
    <div className="mt-6 space-y-5">
      <div>
        <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-1">
          Site edit thread
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          {site.businessName}
        </h1>
        <p className="text-xs mono text-[var(--color-mute)] mt-1">
          {site.ownerName} &lt;{site.ownerEmail}&gt;
        </p>
      </div>

      <div className="card rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] mono text-[var(--color-mute)] uppercase tracking-widest">
            Status
          </span>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] mono uppercase tracking-widest border transition ${
                status === s
                  ? STATUS_CLASS[s]
                  : "text-[var(--color-mute)] border-white/10 hover:border-white/30"
              }`}
            >
              {EDIT_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <a
          href={customerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs mono text-[var(--color-gold)] hover:underline"
        >
          customer view ↗
        </a>
      </div>

      <form
        onSubmit={saveLiveUrl}
        className="card rounded-xl p-4 sm:p-5 flex flex-wrap items-end gap-3"
      >
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] mono uppercase tracking-widest text-[var(--color-mute)] block mb-1">
            Live URL
          </label>
          <input
            type="url"
            value={liveUrl}
            onChange={(e) => setLiveUrl(e.target.value)}
            placeholder="https://acmecoffee.com"
            className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm focus:border-[var(--color-gold)] focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={savingMeta || liveUrl === (site.liveUrl ?? "")}
          className="rounded-md border border-white/20 hover:border-[var(--color-gold)] px-3 py-2 text-xs mono disabled:opacity-40"
        >
          {savingMeta ? "Saving…" : "Save URL"}
        </button>
      </form>

      <div
        ref={threadRef}
        className="card rounded-xl p-4 sm:p-6 max-h-[60vh] overflow-y-auto flex flex-col gap-3"
      >
        {site.messages.map((m) => {
          const isStudio = m.from === "studio";
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
              className={`flex flex-col gap-1 ${isStudio ? "items-end" : "items-start"}`}
            >
              <div className="text-[10px] mono uppercase tracking-widest text-[var(--color-mute)]">
                {isStudio ? "Studio" : site.ownerName} · {timeLabel(m.at)}
              </div>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  isStudio
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

      <form onSubmit={sendReply} className="card rounded-xl p-4 sm:p-5">
        <label htmlFor="studio-reply" className="sr-only">
          Reply
        </label>
        <textarea
          id="studio-reply"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              const form = e.currentTarget.form;
              if (form) form.requestSubmit();
            }
          }}
          rows={3}
          placeholder="Write back to the customer. They get a notification email with this message."
          className="w-full rounded-md border border-white/15 bg-black/30 px-4 py-3 text-sm focus:border-[var(--color-gold)] focus:outline-none resize-y"
          disabled={submitting}
        />
        <div className="flex items-center justify-between gap-3 mt-3">
          <p className="text-[10px] mono text-[var(--color-mute)]">
            Cmd/Ctrl+Enter to send. Status change posts a system note even if
            the reply is empty.
          </p>
          <button
            type="submit"
            disabled={submitting || (!body.trim() && status === site.status)}
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
