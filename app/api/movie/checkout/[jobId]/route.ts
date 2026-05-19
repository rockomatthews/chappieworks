import { NextResponse } from "next/server";
import Stripe from "stripe";
import { readState, writeState } from "../../../../lib/movies";
import { isBypassEmail, sendCleanMovieEmail } from "../../../../lib/movieEmail";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

// Map of duration → env var holding the Stripe Price ID. Lets us add new
// tiers (e.g. 15s) by just dropping in another env without code edits.
function priceIdForDuration(durationSec: number | undefined): string | null {
  if (durationSec === 10) {
    return process.env.STRIPE_MOVIE_PRICE_ID_10S ?? null;
  }
  return process.env.STRIPE_MOVIE_PRICE_ID ?? null;
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await ctx.params;

  const state = await readState(jobId);
  if (!state) {
    return NextResponse.json({ error: "job not found" }, { status: 404 });
  }
  if (state.status !== "ready") {
    return NextResponse.json(
      { error: "movie not ready yet" },
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
    if (!state.cleanUrl) {
      return NextResponse.json(
        { error: "clean video not ready — wait a few seconds and retry" },
        { status: 503 },
      );
    }
    const updated = {
      ...state,
      paid: true,
      paidAt: new Date().toISOString(),
      stripeSessionId: "bypass",
    };
    await writeState(updated);
    await sendCleanMovieEmail({
      to: state.email,
      jobId,
      prompt: state.prompt,
      cleanUrl: state.cleanUrl,
      bypass: true,
    });
    console.log("[chappieworks:movie] bypass unlock", jobId, "→", state.email);
    return NextResponse.json({
      url: `${origin}/m/${jobId}?paid=1&bypass=1`,
      bypassed: true,
    });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = priceIdForDuration(state.durationSec);
  if (!secretKey || !priceId) {
    console.error(
      "[chappieworks:movie] checkout missing config",
      "secretKey?",
      !!secretKey,
      "duration",
      state.durationSec,
      "priceId?",
      !!priceId,
    );
    return NextResponse.json(
      { error: "checkout offline" },
      { status: 503 },
    );
  }

  const stripe = new Stripe(secretKey);

  try {
    const kind =
      state.durationSec === 10 ? "movie-unwatermark-10s" : "movie-unwatermark";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
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
