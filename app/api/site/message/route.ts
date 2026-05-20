import { NextResponse } from "next/server";
import { after } from "next/server";
import { appendMessage, readSite } from "../../../lib/sites";
import { readSessionFor } from "../../../lib/siteAuth";
import { notifyOperatorOfMessage } from "../../../lib/siteNotify";

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

  const session = await readSessionFor(slug);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }
  const site = await readSite(slug);
  if (!site || site.ownerEmail !== session.email) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  const updated = await appendMessage(slug, {
    from: "customer",
    body,
    statusChange: site.status === "shipped" ? "received" : undefined,
  });
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Save failed" }, { status: 500 });
  }

  after(() =>
    notifyOperatorOfMessage({ site: updated, body }).catch((err) => {
      console.error("[chappieworks:site-message] notify threw", err);
    }),
  );

  return NextResponse.json({ ok: true, site: updated });
}
