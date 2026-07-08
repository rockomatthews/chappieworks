import { NextResponse, after } from "next/server";
import Stripe from "stripe";
import { readState, writeState } from "../../../../lib/movies";
import { isBypassEmail } from "../../../../lib/movieEmail";
import { deliverMovieHd } from "../../../../lib/movieUpscale";
import { startGeneration } from "../../../../lib/movieStart";

export const runtime = "nodejs";
// Room for post-response `after()` HD upscale on the bypass path.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Inline pricing — no pre-created Stripe product/price needed. The session
// builds the price on the fly, so checkout works on a fresh Stripe account.
function videoPrice(durationSec: number | undefined): {
  unitAmount: number;
  name: string;
} {
  const isExt = durationSec === 10;
  return {
    unitAmount: isExt ? 2499 : 1499, // $24.99 10s / $14.99 5s
    name: isExt
      ? "Chappie Video — 10s clean 1080p AI clip"
      : "Chappie Video — 5s clean 1080p AI clip",
  };
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await ctx.params;

  // Embedded mode keeps the buyer on chappieworks.com (Stripe checkout rendered
  // in a panel). Falls back to a hosted redirect when the client can't embed
  // (e.g. NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not set).
  const body = (await req.json().catch(() => ({}))) as { embedded?: boolean };
  const embedded = body?.embedded === true;

  const state = await readState(jobId);
  if (!state) {
    return NextResponse.json({ error: "job not found" }, { status: 404 });
  }
  // Pay-first: checkout happens on the recorded brief (awaiting_payment) and
  // the render starts from the webhook. "ready" is still accepted for legacy
  // jobs that pre-rendered a watermarked preview.
  if (state.status !== "awaiting_payment" && state.status !== "ready") {
    return NextResponse.json(
      { error: "job not payable in its current state" },
      { status: 400 },
    );
  }
  if (state.paid) {
    return NextResponse.json(
      { error: "already paid", redirect: `/m/${jobId}` },
      { status: 400 },
    );
  }

  const origin =
    req.headers.get("origin") ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://chappieworks.com");

  if (isBypassEmail(state.email)) {
    const updated = {
      ...state,
      paid: true,
      paidAt: new Date().toISOString(),
      stripeSessionId: "bypass",
      hdPending: true,
    };
    await writeState(updated);
    if (state.status === "awaiting_payment") {
      // Pay-first: kick off the render now that "payment" cleared.
      after(() =>
        startGeneration(jobId).catch((err) =>
          console.error(
            "[chappieworks:movie] bypass generation threw",
            jobId,
            err instanceof Error ? err.message : err,
          ),
        ),
      );
    } else if (state.cleanUrl) {
      // Legacy pre-rendered job: unlock + deliver the HD file.
      after(() =>
        deliverMovieHd(jobId, { bypass: true }).catch((err) =>
          console.error(
            "[chappieworks:movie] bypass hd delivery threw",
            jobId,
            err instanceof Error ? err.message : err,
          ),
        ),
      );
    }
    console.log("[chappieworks:movie] bypass unlock", jobId, "→", state.email);
    return NextResponse.json({
      url: `${origin}/m/${jobId}?paid=1&bypass=1`,
      bypassed: true,
    });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("[chappieworks:movie] checkout missing STRIPE_SECRET_KEY");
    return NextResponse.json({ error: "checkout offline" }, { status: 503 });
  }

  const stripe = new Stripe(secretKey);
  const price = videoPrice(state.durationSec);
  const lineItems = [
    {
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: price.unitAmount,
        product_data: { name: price.name },
      },
    },
  ];

  try {
    const kind =
      state.durationSec === 10 ? "movie-unwatermark-10s" : "movie-unwatermark";

    if (embedded) {
      const session = await stripe.checkout.sessions.create({
        ui_mode: "embedded_page",
        mode: "payment",
        line_items: lineItems,
        customer_email: state.email,
        return_url: `${origin}/m/${jobId}?paid=1&session_id={CHECKOUT_SESSION_ID}`,
        metadata: { jobId, kind },
        payment_intent_data: { metadata: { jobId, kind } },
      });
      return NextResponse.json({
        clientSecret: session.client_secret,
        sessionId: session.id,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: state.email,
      success_url: `${origin}/m/${jobId}?paid=1`,
      cancel_url: `${origin}/m/${jobId}`,
      metadata: { jobId, kind },
      payment_intent_data: {
        metadata: { jobId, kind },
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error(
      "[chappieworks:movie] stripe checkout create failed",
      message,
    );
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
