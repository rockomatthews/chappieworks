import { NextResponse } from "next/server";
import Stripe from "stripe";
import { readSite, writeSite, EDIT_PRICE_CENTS } from "../../../../lib/sites";
import { isBypassEmail } from "../../../../lib/movieEmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// $25 per edit request beyond the free 5. Embedded Stripe; on payment the webhook
// (kind "website-edit") grants one more edit credit (editsPaid++). Master email
// gets the credit free for testing.
export async function POST(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { embedded?: boolean };

  const site = await readSite(slug);
  if (!site) {
    return NextResponse.json({ error: "site not found" }, { status: 404 });
  }
  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://chappieworks.com";

  if (isBypassEmail(site.ownerEmail)) {
    await writeSite({ ...site, editsPaid: (site.editsPaid ?? 0) + 1 });
    return NextResponse.json({ bypassed: true });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "checkout offline" }, { status: 503 });
  }
  const stripe = new Stripe(secretKey);
  const meta = { kind: "website-edit", slug };
  const lineItems = [
    {
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: EDIT_PRICE_CENTS,
        product_data: { name: "Chappie Site — edit request" },
      },
    },
  ];

  try {
    if (body.embedded === true) {
      const session = await stripe.checkout.sessions.create({
        ui_mode: "embedded_page",
        mode: "payment",
        line_items: lineItems,
        customer_email: site.ownerEmail,
        return_url: `${origin}/site/${slug}?edit_paid=1&session_id={CHECKOUT_SESSION_ID}`,
        metadata: meta,
        payment_intent_data: { metadata: meta },
      });
      return NextResponse.json({ clientSecret: session.client_secret });
    }
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: site.ownerEmail,
      success_url: `${origin}/site/${slug}?edit_paid=1`,
      cancel_url: `${origin}/site/${slug}`,
      metadata: meta,
      payment_intent_data: { metadata: meta },
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[chappieworks:website] edit checkout failed", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
