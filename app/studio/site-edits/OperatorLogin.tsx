"use client";

import { useState } from "react";

export function OperatorLogin() {
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/studio/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setError(data.error ?? "Bad token");
      } else {
        location.reload();
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="card rounded-xl p-6 sm:p-8 flex flex-col gap-3">
      <p className="text-sm text-[var(--color-paper)]/75 mb-2">
        Paste the studio operator token to sign in.
      </p>
      <input
        type="password"
        autoComplete="off"
        required
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="operator token"
        className="w-full rounded-md border border-white/15 bg-black/30 px-4 py-3 text-sm mono focus:border-[var(--color-gold)] focus:outline-none"
      />
      <button
        type="submit"
        disabled={submitting || !token}
        className="rounded-md bg-[var(--color-gold)] text-black px-4 py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Signing in…" : "Sign in"}
      </button>
      {error ? (
        <p className="text-sm text-[var(--color-rust)] mt-1">{error}</p>
      ) : null}
    </form>
  );
}
