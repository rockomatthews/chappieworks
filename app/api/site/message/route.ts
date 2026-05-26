import { NextResponse } from "next/server";
import { after } from "next/server";
import { appendMessage, readSite } from "../../../lib/sites";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { notifyOperatorOfMessage } from "../../../lib/siteNotify";
import { autoApplyEdit } from "../../../lib/siteAutoApply";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 4000;

export async function POST(req: Request) {
  let parsed: { slug?: string; body?: string };
  try {
    parsed = (await req.json()) as { slug?: string; body?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 });
  }
  const slug = (parsed.slug ?? "").trim();
  const body = (parsed.body ?? "").trim();
  if (!slug || !body) {
    return NextResponse.json({ ok: false, error: "Empty message" }, { status: 400 });
  }
  if (body.length > MAX_BODY) {
    return NextResponse.json({ ok: false, error: "Message too long" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const sessionEmail = user?.email?.toLowerCase() ?? null;
  if (!sessionEmail) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }
  const site = await readSite(slug);
  if (!site || site.ownerEmail !== sessionEmail) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  const afterCustomer = await appendMessage(slug, {
    from: "customer",
    body,
    statusChange: site.status === "shipped" ? "received" : undefined,
  });
  if (!afterCustomer) {
    return NextResponse.json({ ok: false, error: "Save failed" }, { status: 500 });
  }

  const canAutoApply = !!site.githubRepo && !!process.env.ANTHROPIC_API_KEY;

  const updated = await appendMessage(slug, {
    from: "system",
    body: canAutoApply
      ? "On it — the studio agent is working on this now. New deploy lands in a few minutes."
      : "Studio notified — a real reply lands here within 24 hours.",
    statusChange: canAutoApply ? "in_progress" : undefined,
  });
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Save failed" }, { status: 500 });
  }

  if (canAutoApply) {
    after(() =>
      autoApplyEdit({ site: updated, request: body }).catch((err) => {
        console.error("[chappieworks:site-message] autoApplyEdit threw", err);
      }),
    );
  } else {
    after(() =>
      notifyOperatorOfMessage({ site: updated, body }).catch((err) => {
        console.error("[chappieworks:site-message] notify threw", err);
      }),
    );
  }

  return NextResponse.json({ ok: true, site: updated });
}
