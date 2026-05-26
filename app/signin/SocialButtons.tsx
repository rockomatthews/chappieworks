"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export function SocialButtons({ next }: { next?: string }) {
  const [busy, setBusy] = useState<string | null>(null);

  const xEnabled =
    process.env.NEXT_PUBLIC_X_AUTH_ENABLED === "true";

  async function signInWithX() {
    if (!xEnabled) return;
    setBusy("x");
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const redirectTo = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next ?? "/studio")}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "twitter",
      options: { redirectTo },
    });
    if (error) {
      console.error("X sign-in failed", error.message);
      setBusy(null);
    }
  }

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[10px] mono uppercase tracking-widest text-[var(--color-mute)]">
          or
        </span>
        <div className="h-px flex-1 bg-white/10" />
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={signInWithX}
          disabled={!xEnabled || busy !== null}
          className="rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] px-4 py-3 text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          title={xEnabled ? "Sign in with X" : "X sign-in coming soon"}
        >
          {busy === "x" ? "Redirecting…" : "Continue with X"}
          {!xEnabled ? (
            <span className="text-[10px] mono text-[var(--color-mute)] uppercase">
              soon
            </span>
          ) : null}
        </button>
        <button
          type="button"
          disabled
          className="rounded-md border border-white/15 px-4 py-3 text-sm opacity-50 cursor-not-allowed flex items-center justify-center gap-2"
          title="Farcaster sign-in coming soon"
        >
          Continue with Farcaster
          <span className="text-[10px] mono text-[var(--color-mute)] uppercase">
            soon
          </span>
        </button>
        <p className="text-xs text-[var(--color-mute)] mt-2 leading-relaxed">
          Connect a crypto wallet from <span className="mono">/account</span>{" "}
          after email sign-in to view your $CHAPPIE balance.
        </p>
      </div>
    </div>
  );
}
