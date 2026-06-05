import { NextResponse } from "next/server";
import Stripe from "stripe";

// Diagnostic: exercises the embedded-checkout path end-to-end with the live keys
// without a real purchase. Creates a throwaway $1 embedded session (abandoned,
// never charged), then reports secret-key mode, publishable-key mode, whether
// they match, and whether a client_secret was produced. Gated by CRON_SECRET or
// X_AUTOPOST_TOKEN.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: Request): boolean {
  const auth = req.headers.get("authorization");
  const cron = process.env.CRON_SECRET;
  const autopost = process.env.X_AUTOPOST_TOKEN;
  if (cron && auth === `Bearer ${cron}`) return true;
  if (autopost && auth === `Bearer ${autopost}`) return true;
  return false;
}

function pkMode(): "live" | "test" | "missing" | "unknown" {
  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!pk) return "missing";
  if (pk.startsWith("pk_live")) return "live";
  if (pk.startsWith("pk_test")) return "test";
  return "unknown";
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const sk = process.env.STRIPE_SECRET_KEY;
  if (!sk) return NextResponse.json({ ok: false, reason: "no-secret-key" });

  const publishableKeyMode = pkMode();
  const stripe = new Stripe(sk);
  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded_page",
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: 100,
            product_data: { name: "Chappie checkout verify — ignore" },
          },
        },
      ],
      return_url: "https://chappieworks.com/movie?verify=1",
    });
    const secretKeyMode = session.livemode ? "live" : "test";
    return NextResponse.json({
      ok: true,
      secretKeyMode,
      publishableKeyMode,
      modesMatch:
        publishableKeyMode !== "missing" &&
        publishableKeyMode !== "unknown" &&
        publishableKeyMode === secretKeyMode,
      clientSecretCreated: Boolean(session.client_secret),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, publishableKeyMode, error: (err as Error).message },
      { status: 502 }
    );
  }
}
