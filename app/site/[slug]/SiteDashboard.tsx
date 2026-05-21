"use client";

import { useEffect, useRef, useState } from "react";
import { EDIT_STATUS_LABELS, type EditStatus, type SiteRecord } from "../../lib/sites";

type DraftMsg = { role: "user" | "assistant"; content: string };

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

export function SiteDashboard({ initialSite }: { initialSite: SiteRecord }) {
  const [site, setSite] = useState<SiteRecord>(initialSite);
  const [draft, setDraft] = useState<DraftMsg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [proposedEdit, setProposedEdit] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [briefOpen, setBriefOpen] = useState(false);
  const draftRef = useRef<HTMLDivElement | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (draftRef.current) draftRef.current.scrollTop = draftRef.current.scrollHeight;
  }, [draft.length, thinking]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [site.messages.length]);

  async function chat(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || thinking) return;
    const next: DraftMsg[] = [...draft, { role: "user", content: trimmed }];
    setDraft(next);
    setInput("");
    setThinking(true);
    setError(null);
    try {
      const res = await fetch("/api/site/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: site.slug, messages: next }),
      });
      const data = (await res.json()) as
        | { reply: string; summary: string | null }
        | { error: string };
      if ("error" in data) {
        setError(data.error);
        return;
      }
      const reply = (data.reply || "").trim();
      if (reply) {
        setDraft((d) => [...d, { role: "assistant", content: reply }]);
      }
      if (data.summary) setProposedEdit(data.summary);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setThinking(false);
    }
  }

  async function submitEdit() {
    if (!proposedEdit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/site/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: site.slug, body: proposedEdit }),
      });
      const data = (await res.json()) as
        | { ok: true; site: SiteRecord }
        | { ok: false; error: string };
      if (!data.ok) {
        setError(data.error);
      } else {
        setSite(data.site);
        setDraft([]);
        setProposedEdit(null);
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
            Latest status
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

      <div className="card rounded-xl p-5 sm:p-6">
        <h2 className="text-base font-semibold mb-2">How this works</h2>
        <ol className="text-sm text-[var(--color-paper)]/80 leading-relaxed space-y-1.5 list-decimal list-inside">
          <li>Tell Chappie what you want changed — vague is fine, it&rsquo;ll ask.</li>
          <li>Chappie restates the edit in studio-ready language as you go.</li>
          <li>Hit <span className="text-[var(--color-gold)]">Submit edit</span> when the proposed change looks right. The studio ships it within 24 hours.</li>
        </ol>
      </div>

      {site.brief ? (
        <details
          className="card rounded-xl p-4 sm:p-5"
          open={briefOpen}
          onToggle={(e) => setBriefOpen((e.currentTarget as HTMLDetailsElement).open)}
        >
          <summary className="cursor-pointer text-xs mono uppercase tracking-widest text-[var(--color-mute)] hover:text-[var(--color-gold)] list-none flex items-center justify-between">
            <span>Original brief on file</span>
            <span aria-hidden="true">{briefOpen ? "−" : "+"}</span>
          </summary>
          <pre className="mt-3 whitespace-pre-wrap break-words text-sm text-[var(--color-paper)]/80 leading-relaxed font-sans">
            {site.brief}
          </pre>
        </details>
      ) : null}

      <div className="card rounded-xl p-4 sm:p-5">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-base font-semibold">Compose an edit</h2>
          <span className="text-[10px] mono text-[var(--color-mute)] uppercase tracking-widest">
            Chat with Chappie
          </span>
        </div>
        <div
          ref={draftRef}
          className="border border-white/10 rounded-md bg-black/20 p-3 sm:p-4 max-h-[40vh] overflow-y-auto flex flex-col gap-3 mb-3"
        >
          {draft.length === 0 ? (
            <p className="text-sm text-[var(--color-mute)] italic">
              Type anything — &ldquo;make the header darker&rdquo;, &ldquo;add a contact page&rdquo;, &ldquo;swap the hero image for a new one I&rsquo;ll send&rdquo;. Chappie will narrow it down with you.
            </p>
          ) : (
            draft.map((m, i) => (
              <div
                key={i}
                className={`flex flex-col gap-1 ${m.role === "user" ? "items-end" : "items-start"}`}
              >
                <div className="text-[10px] mono uppercase tracking-widest text-[var(--color-mute)]">
                  {m.role === "user" ? "You" : "Chappie"}
                </div>
                <div
                  className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-3 sm:px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    m.role === "user"
                      ? "bg-[var(--color-gold)]/15 border border-[var(--color-gold)]/30 rounded-tr-sm"
                      : "bg-white/5 border border-white/10 rounded-tl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))
          )}
          {thinking ? (
            <div className="flex items-start">
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-2.5">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-mute)] animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-mute)] animate-pulse [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-mute)] animate-pulse [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <form onSubmit={chat}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                const form = e.currentTarget.form;
                if (form && input.trim()) form.requestSubmit();
              }
            }}
            rows={2}
            placeholder="What would you like changed?"
            className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-base sm:text-sm focus:border-[var(--color-gold)] focus:outline-none resize-y"
            disabled={thinking}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
            <p className="hidden sm:block text-[10px] mono text-[var(--color-mute)]">
              Cmd/Ctrl+Enter to send.
            </p>
            <button
              type="submit"
              disabled={thinking || !input.trim()}
              className="ml-auto rounded-md border border-white/20 hover:border-[var(--color-gold)] px-3 py-1.5 text-xs mono disabled:opacity-40"
            >
              {thinking ? "Thinking…" : "Send"}
            </button>
          </div>
        </form>

        {proposedEdit ? (
          <div className="mt-5 border border-[var(--color-gold)]/40 bg-[var(--color-gold)]/5 rounded-md p-4">
            <div className="text-[10px] mono uppercase tracking-widest text-[var(--color-gold)] mb-2">
              Proposed edit
            </div>
            <p className="text-sm text-[var(--color-paper)]/90 leading-relaxed whitespace-pre-wrap break-words">
              {proposedEdit}
            </p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 mt-4">
              <p className="text-[10px] mono text-[var(--color-mute)]">
                Looks right? Submit it. Not quite? Keep refining above.
              </p>
              <button
                type="button"
                onClick={submitEdit}
                disabled={submitting}
                className="w-full sm:w-auto rounded-md bg-[var(--color-gold)] text-black px-4 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting…" : "Submit edit to the studio →"}
              </button>
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="mt-3 text-sm text-[var(--color-rust)]">{error}</p>
        ) : null}
      </div>

      <div className="card rounded-xl p-4 sm:p-6">
        <h2 className="text-base font-semibold mb-3">Submitted edits &amp; studio replies</h2>
        <div
          ref={threadRef}
          className="max-h-[60vh] overflow-y-auto flex flex-col gap-3"
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
                  {isCustomer ? "You · submitted" : "The studio"} · {timeLabel(m.at)}
                </div>
                <div
                  className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-3 sm:px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
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
      </div>
    </div>
  );
}
