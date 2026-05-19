"use client";

import { useState } from "react";

export function UnlockButton({
  jobId,
  priceLabel,
}: {
  jobId: string;
  priceLabel: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/movie/checkout/${jobId}`, {
        method: "POST",
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "couldn't start checkout");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "checkout failed");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={() => void startCheckout()}
        disabled={loading}
        className="w-full sm:w-auto px-6 py-3 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] font-medium hover:opacity-90 transition disabled:opacity-50"
      >
        {loading ? "Opening checkout…" : `Buy clean HD — ${priceLabel} →`}
      </button>
      {error && (
        <p
          role="alert"
          className="text-sm text-[var(--color-rust)] mt-3"
        >
          {error}
        </p>
      )}
    </div>
  );
}
