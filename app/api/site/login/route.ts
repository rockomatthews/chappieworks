import { NextResponse } from "next/server";
import { readSite, normalizeEmail } from "../../../lib/sites";
import { makeMagicToken } from "../../../lib/siteAuth";
import { sendMagicLink } from "../../../lib/siteNotify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Generic success copy regardless of match — prevents email enumeration.
const GENERIC_OK =
  "If that email matches the owner on file, a sign-in link is on its way. Check your inbox (and spam) within a minute.";

export async function POST(req: Request) {
  let body: { slug?: string; email?: string };
  try {
    body = (await req.json()) as { slug?: string; email?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 });
  }
  const slug = (body.slug ?? "").trim();
  const email = normalizeEmail(body.email ?? "");
  if (!slug || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Missing slug or email" }, { status: 400 });
  }

  const site = await readSite(slug);
  if (!site) {
    // Don't reveal whether the slug exists.
    return NextResponse.json({ ok: true, message: GENERIC_OK });
  }
  if (site.ownerEmail !== email) {
    return NextResponse.json({ ok: true, message: GENERIC_OK });
  }

  const token = makeMagicToken(slug, email);
  const result = await sendMagicLink({
    to: email,
    slug,
    token,
    businessName: site.businessName,
  });
  if (!result.ok) {
    console.error("[chappieworks:site-login] email send failed", result.error);
    return NextResponse.json(
      { ok: false, error: "Could not send sign-in email — please try again in a minute." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, message: GENERIC_OK });
}
