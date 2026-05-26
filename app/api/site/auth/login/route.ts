import { NextResponse } from "next/server";
import { readSite, normalizeEmail } from "../../../../lib/sites";
import { checkLoginRateLimit } from "../../../../lib/siteRateLimit";
import { mintSiteMagicLink } from "../../../../lib/supabase/magiclink";
import { sendMagicLink } from "../../../../lib/siteNotify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    return NextResponse.json(
      { ok: false, error: "Missing slug or email" },
      { status: 400 },
    );
  }

  const rl = await checkLoginRateLimit(slug, email);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: true, message: GENERIC_OK },
      { headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const site = await readSite(slug);
  if (!site || site.ownerEmail !== email) {
    return NextResponse.json({ ok: true, message: GENERIC_OK });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://chappieworks.com";

  const minted = await mintSiteMagicLink({ email, slug, baseUrl });
  if (!minted.ok) {
    return NextResponse.json(
      { ok: false, error: "Could not create sign-in link — please try again." },
      { status: 500 },
    );
  }

  const result = await sendMagicLink({
    to: email,
    link: minted.link,
    businessName: site.businessName,
  });
  if (!result.ok) {
    console.error(
      "[chappieworks:site-auth-login] email send failed",
      result.error,
    );
    return NextResponse.json(
      { ok: false, error: "Could not send sign-in email — please try again." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, message: GENERIC_OK });
}
