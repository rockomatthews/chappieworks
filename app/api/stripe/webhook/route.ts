import { NextResponse } from "next/server";
import Stripe from "stripe";
import { readState, writeState } from "../../../lib/movies";
import { sendCleanMovieEmail } from "../../../lib/movieEmail";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!secret || !apiKey) {
    console.error("[chappieworks:stripe-webhook] missing config");
    return NextResponse.json({ error: "config" }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "no signature" }, { status: 400 });
  }
  const rawBody = await req.text();

  const stripe = new Stripe(apiKey);
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[chappieworks:stripe-webhook] sig verify failed", message);
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const jobId = session.metadata?.jobId;
  if (!jobId) {
    return NextResponse.json({ received: true, note: "no jobId metadata" });
  }

  try {
    const state = await readState(jobId);
    if (!state) {
      return NextResponse.json({ received: true, note: "state missing" });
    }
    if (state.paid) {
      return NextResponse.json({ received: true, note: "already paid" });
    }

    const updated = {
      ...state,
      paid: true,
      paidAt: new Date().toISOString(),
      stripeSessionId: session.id,
    };
    await writeState(updated);

    if (updated.cleanUrl) {
      await sendCleanMovieEmail({
        to: state.email,
        jobId,
        prompt: state.prompt,
        cleanUrl: updated.cleanUrl,
      });
    }

    console.log(
      "[chappieworks:stripe-webhook] paid",
      jobId,
      "session",
      session.id,
    );
    return NextResponse.json({ received: true, ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[chappieworks:stripe-webhook] handler failed", message);
    return NextResponse.json({ received: true, error: message }, { status: 500 });
  }
}
