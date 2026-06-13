import { NextResponse, after } from "next/server";
import Stripe from "stripe";
import { createSite, appendMessage, readSite, writeSite } from "../../../lib/sites";
import { isBypassEmail } from "../../../lib/movieEmail";
import { mintSiteMagicLink } from "../../../lib/supabase/magiclink";
import { sendMagicLink } from "../../../lib/siteNotify";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const LAUNCH = 9900; // $99 one-time launch fee (no subscription — 5 free edits, then $25/request)

// Pay-right-away for a Chappie Site: $99 launch (one-time), on-page (embedded
// Stripe). On success the buyer gets a magic link to their private edit-chat
// dashboard. Master email (BYPASS_CHECKOUT_EMAIL) skips Stripe for testing.
//
// STEP 3 TODO (see memory proj-website-checkout): (1) pay-by-existing-slug so the
// proposal email links back here to pay on-site (no off-site Stripe link); (2)
// dashboard "building" status until shipped, then edits; (3) non-expiring access;
// (4) edit counter — first 5 free, then a $25/request Stripe charge.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    embedded?: boolean;
    email?: string;
    name?: string;
    businessName?: string;
    brief?: string;
    slug?: string; // pay for an EXISTING brief's site (dashboard / email link)
  };
  const slug = (body.slug ?? "").trim();
  let email = (body.email ?? "").trim().toLowerCase();
  const name = (body.name ?? "").trim();
  const businessName = (body.businessName ?? "").trim();
  const brief = (body.brief ?? "").trim();

  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://chappieworks.com";

  let site;
  if (slug) {
    // Pay for an existing site (created from the brief) — from the dashboard CTA
    // or the proposal email link. Owner email comes off the record.
    const existing = await readSite(slug);
    if (!existing) {
      return NextResponse.json({ error: "site not found" }, { status: 404 });
    }
    if (existing.paid) {
      return NextResponse.json({ error: "already paid", paid: true }, { status: 400 });
    }
    site = existing;
    email = existing.ownerEmail;
  } else {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "a valid email is required" }, { status: 400 });
    }
    if (!businessName) {
      return NextResponse.json({ error: "business name is required" }, { status: 400 });
    }
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
      const fresh = (await readSite(site.slug)) ?? site;
      await writeSite({ ...fresh, paid: true, paidAt: new Date().toISOString() });
      await appendMessage(site.slug, {
        from: "system",
        body: "Launch fee bypassed (internal test). Build started.",
        statusChange: "in_progress",
      });
      const link = await dashboardLinkFor(site.slug);
      after(() =>
        sendMagicLink({ to: email, link, businessName: site.businessName }).catch((e) =>
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
  const lineItems = [
    {
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: LAUNCH,
        product_data: { name: "Chappie Site — $99 launch (build + 5 free edits)" },
      },
    },
  ];

  try {
    if (body.embedded === true) {
      const session = await stripe.checkout.sessions.create({
        ui_mode: "embedded_page",
        mode: "payment",
        line_items: lineItems,
        customer_email: email,
        return_url: `${origin}/website?launched=1&slug=${site.slug}&session_id={CHECKOUT_SESSION_ID}`,
        metadata: meta,
        payment_intent_data: { metadata: meta },
      });
      return NextResponse.json({ clientSecret: session.client_secret, slug: site.slug });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: email,
      success_url: `${origin}/website?launched=1&slug=${site.slug}`,
      cancel_url: `${origin}/website`,
      metadata: meta,
      payment_intent_data: { metadata: meta },
    });
    return NextResponse.json({ url: session.url, slug: site.slug });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[chappieworks:website] checkout failed", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
