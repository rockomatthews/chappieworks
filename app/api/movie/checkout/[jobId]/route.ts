import { NextResponse } from "next/server";
import Stripe from "stripe";
import { readState } from "../../../../lib/movies";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

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

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_MOVIE_PRICE_ID;
  if (!secretKey || !priceId) {
    console.error(
      "[chappieworks:movie] STRIPE_SECRET_KEY or STRIPE_MOVIE_PRICE_ID missing",
    );
    return NextResponse.json(
      { error: "checkout offline" },
      { status: 503 },
    );
  }

  const origin =
    req.headers.get("origin") ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://chappieworks.com");

  const stripe = new Stripe(secretKey);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: state.email,
      success_url: `${origin}/m/${jobId}?paid=1`,
      cancel_url: `${origin}/m/${jobId}`,
      metadata: { jobId, kind: "movie-unwatermark" },
      payment_intent_data: {
        metadata: { jobId, kind: "movie-unwatermark" },
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
