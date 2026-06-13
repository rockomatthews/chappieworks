"use client";

import { useEffect, useRef, useState } from "react";
import {
  EDIT_STATUS_LABELS,
  FREE_EDITS,
  type EditStatus,
  type SiteRecord,
} from "../../lib/sites";
import {
  StripeCheckoutModal,
  canEmbedCheckout,
} from "../../components/StripeCheckoutModal";

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
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const draftRef = useRef<HTMLDivElement | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);

  const paid = !!site.paid;
  const delivered =
    !!site.liveUrl || site.status === "shipped" || (site.editsUsed ?? 0) > 0;
  const allowance = FREE_EDITS + (site.editsPaid ?? 0);
  const freeLeft = Math.max(0, FREE_EDITS - (site.editsUsed ?? 0));
  const overBudget = (site.editsUsed ?? 0) >= allowance;

  useEffect(() => {
    if (draftRef.current) draftRef.current.scrollTop = draftRef.current.scrollHeight;
  }, [draft.length, thinking]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [site.messages.length]);

  async function payLaunch() {
    setError(null);
    setPaying(true);
    try {
      const res = await fetch("/api/website/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embedded: canEmbedCheckout(), slug: site.slug }),
      });
      const d = (await res.json()) as { clientSecret?: string; url?: string; bypassed?: boolean; error?: string };
      if (d.bypassed) return location.reload();
      if (d.clientSecret) setClientSecret(d.clientSecret);
      else if (d.url) location.href = d.url;
      else setError(d.error ?? "checkout failed");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setPaying(false);
    }
  }

  async function payEdit() {
    setError(null);
    setPaying(true);
    try {
      const res = await fetch(`/api/website/edit-checkout/${site.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embedded: canEmbedCheckout() }),
      });
      const d = (await res.json()) as { clientSecret?: string; url?: string; bypassed?: boolean; error?: string };
      if (d.bypassed) return location.reload();
      if (d.clientSecret) setClientSecret(d.clientSecret);
      else if (d.url) location.href = d.url;
      else setError(d.error ?? "checkout failed");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setPaying(false);
    }
  }

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
      if (reply) setDraft((d) => [...d, { role: "assistant", content: reply }]);
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
        | { ok: false; error: string; paymentRequired?: boolean };
      if (!data.ok) {
        if (data.paymentRequired) {
          await payEdit();
          return;
        }
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
    await fetch("/api/site/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
            {!paid ? "Awaiting launch" : !delivered ? "Building first draft" : EDIT_STATUS_LABELS[site.status]}
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

      {/* 1) Not paid → pay the launch */}
      {!paid && (
        <div className="card rounded-xl p-6 sm:p-8 border-[var(--color-gold)]/40">
          <h2 className="text-xl font-semibold mb-2">Pay $99 and Chappie starts building.</h2>
          <p className="text-sm text-[var(--color-paper)]/85 mb-4">
            Your brief is in. Pay the one-time $99 launch and the studio starts
            your full build — first draft lands right here, usually within 48
            hours. Your first 5 edit requests are free; $25 each after that. No
            subscription.
          </p>
          {error && <p className="text-sm text-[var(--color-rust)] mb-3">{error}</p>}
          <button
            onClick={payLaunch}
            disabled={paying}
            className="rounded-md bg-[var(--color-gold)] text-black font-semibold px-8 py-3 text-sm hover:opacity-90 disabled:opacity-60"
          >
            {paying ? "Opening checkout…" : "Pay $99 & start the build →"}
          </button>
          <p className="text-[11px] text-[var(--color-mute)] mt-2">Secure checkout right here — no redirect.</p>
        </div>
      )}

      {/* 2) Paid but first draft not delivered → building status */}
      {paid && !delivered && (
        <div className="card rounded-xl p-6 sm:p-8 text-center">
          <div className="inline-block w-8 h-8 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin" />
          <h2 className="text-lg font-semibold mt-4">Chappie is building your first draft.</h2>
          <p className="text-sm text-[var(--color-paper)]/80 mt-2 max-w-md mx-auto">
            The studio is on it — code, design, hosting, domain. Your first draft
            lands here, usually within 48 hours. We&rsquo;ll post the live link in
            this thread the moment it&rsquo;s ready, and that&rsquo;s when edit
            requests open up. This dashboard stays open until your site is done.
          </p>
        </div>
      )}

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

      {/* 3) Paid + delivered → edit composer */}
      {paid && delivered && (
        <div className="card rounded-xl p-4 sm:p-5">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="text-base font-semibold">Request an edit</h2>
            <span className="text-[10px] mono text-[var(--color-mute)] uppercase tracking-widest">
              Chat with Chappie
            </span>
          </div>
          <p className="text-xs mono text-[var(--color-mute)] mb-3">
            {overBudget
              ? "Free edits used — next request is $25."
              : `${freeLeft} of ${FREE_EDITS} free edit${freeLeft === 1 ? "" : "s"} left · $25 each after`}
          </p>
          <div
            ref={draftRef}
            className="border border-white/10 rounded-md bg-black/20 p-3 sm:p-4 max-h-[40vh] overflow-y-auto flex flex-col gap-3 mb-3"
          >
            {draft.length === 0 ? (
              <p className="text-sm text-[var(--color-mute)] italic">
                Type anything — &ldquo;make the header darker&rdquo;, &ldquo;add a contact page&rdquo;, &ldquo;swap the hero image&rdquo;. Chappie will narrow it down with you.
              </p>
            ) : (
              draft.map((m, i) => (
                <div key={i} className={`flex flex-col gap-1 ${m.role === "user" ? "items-end" : "items-start"}`}>
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
              <p className="hidden sm:block text-[10px] mono text-[var(--color-mute)]">Cmd/Ctrl+Enter to send.</p>
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
              <div className="text-[10px] mono uppercase tracking-widest text-[var(--color-gold)] mb-2">Proposed edit</div>
              <p className="text-sm text-[var(--color-paper)]/90 leading-relaxed whitespace-pre-wrap break-words">{proposedEdit}</p>
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 mt-4">
                <p className="text-[10px] mono text-[var(--color-mute)]">
                  {overBudget ? "This one's $25 — you'll pay, then it ships." : "Looks right? Submit it. Not quite? Keep refining above."}
                </p>
                <button
                  type="button"
                  onClick={submitEdit}
                  disabled={submitting || paying}
                  className="w-full sm:w-auto rounded-md bg-[var(--color-gold)] text-black px-4 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting || paying
                    ? "Working…"
                    : overBudget
                      ? "Pay $25 & submit edit →"
                      : "Submit edit to the studio →"}
                </button>
              </div>
            </div>
          ) : null}

          {error ? <p className="mt-3 text-sm text-[var(--color-rust)]">{error}</p> : null}
        </div>
      )}

      <div className="card rounded-xl p-4 sm:p-6">
        <h2 className="text-base font-semibold mb-3">Build updates &amp; studio replies</h2>
        <div ref={threadRef} className="max-h-[60vh] overflow-y-auto flex flex-col gap-3">
          {site.messages.map((m) => {
            const isCustomer = m.from === "customer";
            const isSystem = m.from === "system";
            if (isSystem) {
              return (
                <div key={m.id} className="text-center text-[10px] mono uppercase tracking-widest text-[var(--color-mute)] my-2">
                  {m.body} · {timeLabel(m.at)}
                </div>
              );
            }
            return (
              <div key={m.id} className={`flex flex-col gap-1 ${isCustomer ? "items-end" : "items-start"}`}>
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

      {clientSecret && (
        <StripeCheckoutModal clientSecret={clientSecret} onClose={() => setClientSecret(null)} />
      )}
    </div>
  );
}
