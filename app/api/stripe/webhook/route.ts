import { NextResponse } from "next/server";
import { after } from "next/server";
import Stripe from "stripe";
import { readState, writeState } from "../../../lib/movies";
import { deliverMovieHd } from "../../../lib/movieUpscale";
import {
  generatePackAndEmail,
  readPackState,
} from "../../../lib/photoshootPack";

export const runtime = "nodejs";
// Allow post-response `after()` work (HD upscale + email) room to finish.
export const maxDuration = 300;
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
  const kind = session.metadata?.kind;

  // Branch on SKU. Default (no kind) is the legacy /movie flow which only
  // sets `jobId` metadata.
  if (kind === "photoshoot-pack") {
    const packId = session.metadata?.packId;
    if (!packId) {
      return NextResponse.json(
        { received: true, note: "no packId metadata" },
        { status: 200 },
      );
    }
    try {
      const state = await readPackState(packId);
      if (!state) {
        return NextResponse.json({ received: true, note: "pack state missing" });
      }
      if (state.status === "delivered") {
        return NextResponse.json({ received: true, note: "already delivered" });
      }
      // Pack generation takes 60-300s. Respond fast so Stripe doesn't retry,
      // and run the work after the response via `after`. Idempotent — re-entry
      // sees status === "delivered" and returns early.
      after(() =>
        generatePackAndEmail(packId, {
          stripeSessionId: session.id,
          bypass: false,
        }).catch((err) => {
          console.error(
            "[chappieworks:pack] webhook generation threw",
            packId,
            err instanceof Error ? err.message : err,
          );
        }),
      );
      console.log(
        "[chappieworks:stripe-webhook] photoshoot pack paid, queued",
        packId,
        "session",
        session.id,
      );
      return NextResponse.json({ received: true, ok: true, packId });
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown";
      console.error(
        "[chappieworks:stripe-webhook] pack handler failed",
        message,
      );
      return NextResponse.json(
        { received: true, error: message },
        { status: 500 },
      );
    }
  }

  // Legacy /movie flow.
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
      hdPending: true,
    };
    await writeState(updated);

    // Produce the 1080p deliverable + email it after the response so Stripe
    // gets a fast 200. Idempotent inside deliverMovieHd.
    if (updated.cleanUrl) {
      after(() =>
        deliverMovieHd(jobId).catch((err) =>
          console.error(
            "[chappieworks:movie] hd delivery threw",
            jobId,
            err instanceof Error ? err.message : err,
          ),
        ),
      );
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
