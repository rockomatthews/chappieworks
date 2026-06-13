import { NextResponse } from "next/server";
import { after } from "next/server";
import Stripe from "stripe";
import { readState, writeState } from "../../../lib/movies";
import { deliverMovieHd } from "../../../lib/movieUpscale";
import {
  generatePackAndEmail,
  readPackState,
} from "../../../lib/photoshootPack";
import {
  readState as readShootState,
  writeState as writeShootState,
} from "../../../lib/photoshoots";
import { runPackage } from "../../../lib/photoshootRun";
import { readSite, writeSite, appendMessage } from "../../../lib/sites";
import { mintSiteMagicLink } from "../../../lib/supabase/magiclink";
import { sendMagicLink } from "../../../lib/siteNotify";

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

  // /website pay-right-away launch flow.
  if (kind === "website-launch") {
    const slug = session.metadata?.slug;
    const email = session.metadata?.email;
    if (!slug || !email) {
      return NextResponse.json({ received: true, note: "missing slug/email" });
    }
    try {
      const site = await readSite(slug);
      if (!site) {
        return NextResponse.json({ received: true, note: "site missing" });
      }
      if (site.paid) {
        return NextResponse.json({ received: true, note: "already paid" });
      }
      await writeSite({ ...site, paid: true, paidAt: new Date().toISOString() });
      await appendMessage(slug, {
        from: "system",
        body: "Launch fee paid — the studio has started your build. Your first draft lands here, usually within 48 hours. After that, your first 5 edit requests are free.",
        statusChange: "in_progress",
      });
      const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chappieworks.com";
      after(async () => {
        const minted = await mintSiteMagicLink({ email, slug, baseUrl: origin });
        if (minted.ok) {
          await sendMagicLink({ to: email, link: minted.link, businessName: site.businessName });
        } else {
          console.error("[chappieworks:website] webhook magic link mint failed", slug);
        }
      });
      console.log("[chappieworks:stripe-webhook] website launch paid", slug);
      return NextResponse.json({ received: true, ok: true, slug });
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown";
      console.error("[chappieworks:stripe-webhook] website-launch handler failed", message);
      return NextResponse.json({ received: true, error: message }, { status: 500 });
    }
  }

  // /website per-edit charge ($25 beyond the free 5) → grant one edit credit.
  if (kind === "website-edit") {
    const slug = session.metadata?.slug;
    if (!slug) {
      return NextResponse.json({ received: true, note: "no slug" });
    }
    try {
      const site = await readSite(slug);
      if (site) {
        await writeSite({ ...site, editsPaid: (site.editsPaid ?? 0) + 1 });
      }
      return NextResponse.json({ received: true, ok: true, slug });
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown";
      console.error("[chappieworks:stripe-webhook] website-edit handler failed", message);
      return NextResponse.json({ received: true, error: message }, { status: 500 });
    }
  }

  // New /photoshoot Full Brand Identity Package flow.
  if (kind === "photoshoot-package") {
    const shootId = session.metadata?.jobId;
    if (!shootId) {
      return NextResponse.json({ received: true, note: "no jobId metadata" });
    }
    try {
      const state = await readShootState(shootId);
      if (!state) {
        return NextResponse.json({ received: true, note: "shoot state missing" });
      }
      if (state.packageStatus === "ready" || state.packageStatus === "generating") {
        return NextResponse.json({ received: true, note: "already processing" });
      }
      await writeShootState({
        ...state,
        paid: true,
        paidAt: new Date().toISOString(),
        stripeSessionId: session.id,
        packageStatus: "generating",
      });
      after(() =>
        runPackage(shootId).catch((err) =>
          console.error(
            "[chappieworks:photoshoot] webhook package threw",
            shootId,
            err instanceof Error ? err.message : err,
          ),
        ),
      );
      console.log("[chappieworks:stripe-webhook] brand package paid, queued", shootId);
      return NextResponse.json({ received: true, ok: true, jobId: shootId });
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown";
      console.error("[chappieworks:stripe-webhook] package handler failed", message);
      return NextResponse.json({ received: true, error: message }, { status: 500 });
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
