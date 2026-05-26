"use client";

import { useState } from "react";

export function SiteLogin({ slug }: { slug: string }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/site/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, email }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        message?: string;
        error?: string;
      };
      if (!data.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setMessage(data.message ?? "Check your inbox.");
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card rounded-xl p-6 sm:p-8">
      <h2 className="text-lg font-semibold mb-2">Sign in</h2>
      <p className="text-sm text-[var(--color-paper)]/75 mb-5 leading-relaxed">
        Enter the email tied to this site. We&rsquo;ll send a one-click sign-in
        link.
      </p>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-md border border-white/15 bg-black/30 px-4 py-3 text-sm focus:border-[var(--color-gold)] focus:outline-none"
        />
        <button
          type="submit"
          disabled={submitting || !email}
          className="rounded-md bg-[var(--color-gold)] text-black px-4 py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Sending…" : "Send sign-in link"}
        </button>
      </form>
      {message ? (
        <p className="mt-4 text-sm text-[var(--color-paper)]/85 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded-md px-4 py-3">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 text-sm text-[var(--color-rust)] bg-[var(--color-rust)]/10 border border-[var(--color-rust)]/30 rounded-md px-4 py-3">
          {error}
        </p>
      ) : null}
    </div>
  );
}
