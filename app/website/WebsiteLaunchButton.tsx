"use client";

import { useEffect, useState } from "react";
import {
  StripeCheckoutModal,
  canEmbedCheckout,
} from "../components/StripeCheckoutModal";

// Reads the brief the customer filled in the IntakeForm above (same page) so the
// payment records the SAME full brief — no double entry. Returns null if the
// brief hasn't been filled (we then send them up to it).
function readBriefFromForm():
  | { email: string; name: string; businessName: string; brief: string }
  | null {
  if (typeof document === "undefined") return null;
  const val = (n: string) =>
    (
      document.querySelector(`[name="${n}"]`) as
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement
        | null
    )?.value?.trim() ?? "";

  const email = val("email");
  const businessName = val("business_name");
  if (!email || !businessName) return null;

  const parts: string[] = [];
  const push = (label: string, name: string) => {
    const v = val(name);
    if (v) parts.push(`${label}: ${v}`);
  };
  push("What it does", "business_description");
  push("Site type", "site_type");
  push("Aesthetic", "vibe");
  push("Reference", "reference_url");
  push("Domain", "domain");
  push("Notes", "notes");

  return {
    email,
    name: val("name") || businessName,
    businessName,
    brief: parts.join("\n"),
  };
}

export function WebsiteLaunchButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [done, setDone] = useState<{ link?: string; paid?: boolean } | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("launched") === "1") setDone({ paid: true });
  }, []);

  async function pay() {
    setError(null);
    const data = readBriefFromForm();
    if (!data) {
      setError(
        "One step first: fill in the brief above (business name + email is enough) so Chappie knows what to build — then this button opens checkout right here. Already sent a brief? Your personal payment link is in the email we sent you.",
      );
      document.getElementById("intake")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setBusy(true);
    try {
      const embedded = canEmbedCheckout();
      const res = await fetch("/api/website/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embedded, ...data }),
      });
      const r = (await res.json()) as {
        clientSecret?: string;
        url?: string;
        bypassed?: boolean;
        dashboardLink?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(r.error ?? "checkout failed");
      if (r.bypassed) {
        setDone({ link: r.dashboardLink });
        return;
      }
      if (r.clientSecret) setClientSecret(r.clientSecret);
      else if (r.url) window.location.href = r.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "checkout failed");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="card rounded-xl p-6">
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

  return (
    <div>
      <button
        onClick={pay}
        disabled={busy}
        className="inline-flex items-center justify-center px-8 py-4 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] font-medium hover:opacity-90 transition disabled:opacity-60"
      >
        {busy ? "Opening checkout…" : "Pay now & launch — $99 →"}
      </button>
      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      <p className="text-[11px] text-[var(--color-mute)] mt-2">
        Uses the brief above — fill it first, then checkout opens right here (no
        redirect). Prefer email? Send the brief alone and your proposal email
        arrives with a personal payment link. Either way: pay → Chappie builds →
        you chat with the developer in your private dashboard.
      </p>
      {clientSecret && (
        <StripeCheckoutModal clientSecret={clientSecret} onClose={() => setClientSecret(null)} />
      )}
    </div>
  );
}
