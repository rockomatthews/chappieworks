import { NextResponse, after } from "next/server";
import Stripe from "stripe";
import { createSite, appendMessage } from "../../../lib/sites";
import { isBypassEmail } from "../../../lib/movieEmail";
import { mintSiteMagicLink } from "../../../lib/supabase/magiclink";
import { sendMagicLink } from "../../../lib/siteNotify";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const LAUNCH = 9900; // $99 one-time launch fee
const MONTHLY = 4900; // $49/mo unlimited edits

// Pay-right-away for a Chappie Site: $99 launch + $49/mo, on-page (embedded
// Stripe) instead of the email-a-link flow. On success the buyer gets a magic
// link to their private edit-chat dashboard (same one the operator flow uses).
// Master email (BYPASS_CHECKOUT_EMAIL) skips Stripe for testing.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    embedded?: boolean;
    email?: string;
    name?: string;
    businessName?: string;
    brief?: string;
  };
  const email = (body.email ?? "").trim().toLowerCase();
  const name = (body.name ?? "").trim();
  const businessName = (body.businessName ?? "").trim();
  const brief = (body.brief ?? "").trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "a valid email is required" }, { status: 400 });
  }
  if (!businessName) {
    return NextResponse.json({ error: "business name is required" }, { status: 400 });
  }

  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://chappieworks.com";

  let site;
  try {
    site = await createSite({
      ownerEmail: email,
      ownerName: name || businessName,
      businessName,
      brief: brief || undefined,
    });
  } catch (err) {
    const m = err instanceof Error ? err.message : "unknown";
    console.error("[chappieworks:website] createSite failed", m);
    return NextResponse.json({ error: `createSite: ${m}` }, { status: 500 });
  }

  async function dashboardLinkFor(slug: string): Promise<string> {
    try {
      const minted = await mintSiteMagicLink({ email, slug, baseUrl: origin });
      return minted.ok ? minted.link : `${origin}/studio/site-edits/${slug}`;
    } catch (err) {
      console.error("[chappieworks:website] mintSiteMagicLink threw", err);
      return `${origin}/studio/site-edits/${slug}`;
    }
  }

  // Master-email bypass — skip Stripe, start the build, email the chat link.
  if (isBypassEmail(email)) {
    try {
      await appendMessage(site.slug, {
        from: "system",
        body: "Launch fee bypassed (internal test). Build started.",
        statusChange: "in_progress",
      });
      const link = await dashboardLinkFor(site.slug);
      after(() =>
        sendMagicLink({ to: email, link, businessName }).catch((e) =>
          console.error("[chappieworks:website] bypass magic link email failed", e),
        ),
      );
      return NextResponse.json({ bypassed: true, slug: site.slug, dashboardLink: link });
    } catch (err) {
      const m = err instanceof Error ? err.message : "unknown";
      console.error("[chappieworks:website] bypass path failed", m);
      return NextResponse.json({ error: `bypass: ${m}` }, { status: 500 });
    }
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "checkout offline" }, { status: 503 });
  }
  const stripe = new Stripe(secretKey);
  const meta = { kind: "website-launch", slug: site.slug, email };
  // Subscription with the $99 one-time launch fee on the first invoice.
  const lineItems = [
    {
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: MONTHLY,
        recurring: { interval: "month" as const },
        product_data: { name: "Chappie Site — unlimited edits ($49/mo)" },
      },
    },
    {
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: LAUNCH,
        product_data: { name: "Chappie Site — $99 launch fee" },
      },
    },
  ];

  try {
    if (body.embedded === true) {
      const session = await stripe.checkout.sessions.create({
        ui_mode: "embedded_page",
        mode: "subscription",
        line_items: lineItems,
        customer_email: email,
        return_url: `${origin}/website?launched=1&slug=${site.slug}&session_id={CHECKOUT_SESSION_ID}`,
        metadata: meta,
        subscription_data: { metadata: meta },
      });
      return NextResponse.json({ clientSecret: session.client_secret, slug: site.slug });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: lineItems,
      customer_email: email,
      success_url: `${origin}/website?launched=1&slug=${site.slug}`,
      cancel_url: `${origin}/website`,
      metadata: meta,
      subscription_data: { metadata: meta },
    });
    return NextResponse.json({ url: session.url, slug: site.slug });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[chappieworks:website] checkout failed", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
