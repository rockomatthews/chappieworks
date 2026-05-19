import { NextResponse } from "next/server";
import { after } from "next/server";
import Stripe from "stripe";
import {
  generatePackAndEmail,
  newPackId,
  writePackState,
  type PhotoshootBrief,
} from "../../../lib/photoshootPack";
import { isBypassEmail } from "../../../lib/movieEmail";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const REQUIRED = [
  "name",
  "email",
  "brand_name",
  "brand_description",
  "industry",
  "vibe",
] as const;

export async function POST(req: Request) {
  let body: Partial<PhotoshootBrief>;
  try {
    body = (await req.json()) as Partial<PhotoshootBrief>;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  for (const k of REQUIRED) {
    const v = (body[k] ?? "").toString().trim();
    if (!v) {
      return NextResponse.json(
        { error: `missing required field: ${k}` },
        { status: 400 },
      );
    }
  }
  const email = (body.email ?? "").toString().trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 });
  }

  const brief: PhotoshootBrief = {
    name: body.name!.toString().trim(),
    email,
    brand_name: body.brand_name!.toString().trim(),
    brand_description: body.brand_description!.toString().trim(),
    industry: body.industry!.toString().trim(),
    vibe: body.vibe!.toString().trim(),
    color_palette: body.color_palette?.toString().trim() || undefined,
    reference_url: body.reference_url?.toString().trim() || undefined,
  };

  const packId = newPackId();
  await writePackState({
    packId,
    createdAt: new Date().toISOString(),
    status: "pending",
    brief,
  });

  const origin =
    req.headers.get("origin") ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://chappieworks.com");

  if (isBypassEmail(brief.email)) {
    // Fire-and-forget the generation so the client gets a fast response and
    // can show the "we're working on it" state. Generation takes 60-300s.
    after(() =>
      generatePackAndEmail(packId, { bypass: true }).catch((err) => {
        console.error(
          "[chappieworks:pack] bypass generation threw",
          packId,
          err instanceof Error ? err.message : err,
        );
      }),
    );
    return NextResponse.json({
      url: `${origin}/photoshoot/thanks?pack=${packId}&bypass=1`,
      bypassed: true,
      packId,
    });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PHOTOSHOOT_PACK_PRICE_ID;
  if (!secretKey || !priceId) {
    console.error(
      "[chappieworks:pack] missing stripe config — secretKey?",
      !!secretKey,
      "priceId?",
      !!priceId,
    );
    return NextResponse.json({ error: "checkout offline" }, { status: 503 });
  }

  const stripe = new Stripe(secretKey);
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: brief.email,
      success_url: `${origin}/photoshoot/thanks?pack=${packId}&paid=1`,
      cancel_url: `${origin}/photoshoot?cancelled=1`,
      metadata: { packId, kind: "photoshoot-pack" },
      payment_intent_data: {
        metadata: { packId, kind: "photoshoot-pack" },
      },
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      packId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[chappieworks:pack] stripe checkout create failed", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
