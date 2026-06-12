"use client";

import { useEffect, useState } from "react";
import {
  StripeCheckoutModal,
  canEmbedCheckout,
} from "../components/StripeCheckoutModal";

export function WebsiteLaunchButton() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [brief, setBrief] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [done, setDone] = useState<{ link?: string; paid?: boolean } | null>(null);

  // After Stripe's return_url redirect.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("launched") === "1") setDone({ paid: true });
  }, []);

  async function start() {
    setError(null);
    if (!email || !businessName) {
      setError("Email and business name are required.");
      return;
    }
    setBusy(true);
    try {
      const embedded = canEmbedCheckout();
      const res = await fetch("/api/website/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embedded, email, name, businessName, brief }),
      });
      const data = (await res.json()) as {
        clientSecret?: string;
        url?: string;
        bypassed?: boolean;
        dashboardLink?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "checkout failed");
      if (data.bypassed) {
        setDone({ link: data.dashboardLink });
        return;
      }
      if (data.clientSecret) setClientSecret(data.clientSecret);
      else if (data.url) window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "checkout failed");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="card rounded-xl p-6 mt-3">
        <p className="text-sm text-[var(--color-gold)] mb-2">
          {done.link ? "✓ Build started — internal bypass." : "✓ Payment received — your 48-hour build is underway."}
        </p>
        <p className="text-sm text-[var(--color-paper)]/85 mb-3">
          {done.link
            ? "Your edit-chat dashboard is ready (link also emailed)."
            : "We've emailed a sign-in link to your private edit-chat dashboard — open it to talk to the studio about your build."}
        </p>
        {done.link && (
          <a
            href={done.link}
            className="inline-flex items-center gap-2 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] font-semibold px-6 py-3 text-sm hover:opacity-90"
          >
            Open your chat dashboard →
          </a>
        )}
      </div>
    );
  }

  const inputCls =
    "w-full rounded-md bg-black/30 border border-white/12 px-3 py-2.5 text-sm focus:border-[var(--color-gold)] outline-none";

  return (
    <div className="mt-3">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center px-8 py-4 rounded-md border border-[var(--color-gold)] text-[var(--color-gold)] font-medium hover:bg-[var(--color-gold)] hover:text-[var(--color-ink)] transition"
        >
          Pay now &amp; launch — $99 + $49/mo →
        </button>
      ) : (
        <div className="card rounded-xl p-6 space-y-3">
          <p className="text-sm text-[var(--color-paper)]/85">
            Pay the $99 launch (+ $49/mo edits) and start immediately. You&rsquo;ll
            get a link to chat with the studio about your build.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <input className={inputCls} placeholder="Business name *" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
            <input className={inputCls} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <input type="email" className={inputCls} placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)} />
          <textarea className={`${inputCls} min-h-[70px]`} placeholder="One line on what you do (optional)" value={brief} onChange={(e) => setBrief(e.target.value)} />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button onClick={start} disabled={busy} className="w-full rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] font-semibold py-3 text-sm hover:opacity-90 disabled:opacity-60">
            {busy ? "Opening checkout…" : "Continue to payment →"}
          </button>
          <p className="text-[11px] text-center text-[var(--color-mute)]">Secure checkout on this page. No redirect.</p>
        </div>
      )}
      {clientSecret && (
        <StripeCheckoutModal clientSecret={clientSecret} onClose={() => setClientSecret(null)} />
      )}
    </div>
  );
}
