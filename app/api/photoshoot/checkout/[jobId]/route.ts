import { NextResponse, after } from "next/server";
import Stripe from "stripe";
import { readState, writeState } from "../../../../lib/photoshoots";
import { isBypassEmail } from "../../../../lib/movieEmail";
import { runPackage } from "../../../../lib/photoshootRun";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const PACKAGE_PRICE = 4900; // $49.00
const PACKAGE_NAME = "Chappie Works — Full Brand Identity Package";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as {
    embedded?: boolean;
    email?: string;
  };
  const embedded = body?.embedded === true;
  const email = (body?.email ?? "").trim().toLowerCase();

  const state = await readState(jobId);
  if (!state) {
    return NextResponse.json({ error: "job not found" }, { status: 404 });
  }
  if (state.status !== "ready") {
    return NextResponse.json({ error: "preview not ready yet" }, { status: 400 });
  }
  if (state.paid) {
    return NextResponse.json({ error: "already paid", paid: true }, { status: 400 });
  }
  if (email && email !== state.email) {
    await writeState({ ...state, email });
  }

  const origin =
    req.headers.get("origin") ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://chappieworks.com");

  // Test bypass — unlock + generate the package without paying.
  if (isBypassEmail(email || state.email)) {
    const updated = {
      ...state,
      email: email || state.email,
      paid: true,
      paidAt: new Date().toISOString(),
      stripeSessionId: "bypass",
      packageStatus: "generating" as const,
    };
    await writeState(updated);
    after(() =>
      runPackage(jobId).catch((err) =>
        console.error("[chappieworks:photoshoot] bypass package threw", jobId, err),
      ),
    );
    return NextResponse.json({ bypassed: true, url: `${origin}/photoshoot?job=${jobId}&paid=1` });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "checkout offline" }, { status: 503 });
  }
  const stripe = new Stripe(secretKey);
  const lineItems = [
    {
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: PACKAGE_PRICE,
        product_data: { name: PACKAGE_NAME },
      },
    },
  ];
  const meta = { jobId, kind: "photoshoot-package" };

  try {
    if (embedded) {
      const session = await stripe.checkout.sessions.create({
        ui_mode: "embedded_page",
        mode: "payment",
        line_items: lineItems,
        customer_email: email || state.email,
        return_url: `${origin}/photoshoot?job=${jobId}&paid=1&session_id={CHECKOUT_SESSION_ID}`,
        metadata: meta,
        payment_intent_data: { metadata: meta },
      });
      return NextResponse.json({
        clientSecret: session.client_secret,
        sessionId: session.id,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: email || state.email,
      success_url: `${origin}/photoshoot?job=${jobId}&paid=1`,
      cancel_url: `${origin}/photoshoot?job=${jobId}`,
      metadata: meta,
      payment_intent_data: { metadata: meta },
    });
    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[chappieworks:photoshoot] stripe checkout failed", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
