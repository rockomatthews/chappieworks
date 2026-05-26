"use client";

import { useState } from "react";

export function SignOutButton() {
  const [submitting, setSubmitting] = useState(false);
  async function signOut() {
    setSubmitting(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/";
    }
  }
  return (
    <button
      type="button"
      onClick={signOut}
      disabled={submitting}
      className="text-sm mono text-[var(--color-mute)] hover:text-[var(--color-rust)] underline disabled:opacity-50"
    >
      {submitting ? "Signing out…" : "Sign out"}
    </button>
  );
}
