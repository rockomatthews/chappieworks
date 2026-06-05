"use client";

import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";

// Reusable on-page Stripe checkout. Renders Stripe's Embedded Checkout inside a
// modal so the buyer never leaves chappieworks.com. Pass a clientSecret created
// server-side with ui_mode:"embedded". Returns null (caller falls back to a
// redirect) when the publishable key isn't configured.

const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = pk ? loadStripe(pk) : null;

export function canEmbedCheckout(): boolean {
  return Boolean(pk);
}

export function StripeCheckoutModal({
  clientSecret,
  onClose,
}: {
  clientSecret: string;
  onClose: () => void;
}) {
  if (!stripePromise) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-black/70 backdrop-blur-sm overflow-y-auto p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[480px] my-8 rounded-xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close checkout"
          className="absolute top-2.5 right-3 z-10 text-black/50 hover:text-black text-xl leading-none w-7 h-7"
        >
          ✕
        </button>
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{ clientSecret }}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    </div>
  );
}
