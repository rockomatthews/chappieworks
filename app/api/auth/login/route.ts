import { NextResponse } from "next/server";
import { mintMagicLink } from "../../../lib/supabase/magiclink";
import { sendAuthMagicLink } from "../../../lib/authNotify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GENERIC_OK =
  "A sign-in link is on its way. Check your inbox (and spam) within a minute.";

function normalizeEmail(s: string): string {
  return s.trim().toLowerCase();
}

export async function POST(req: Request) {
  let body: { email?: string; next?: string };
  try {
    body = (await req.json()) as { email?: string; next?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 });
  }

  const email = normalizeEmail(body.email ?? "");
  const next = typeof body.next === "string" && body.next.startsWith("/")
    ? body.next
    : "/studio";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid email." },
      { status: 400 },
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://chappieworks.com";

  const minted = await mintMagicLink({
    email,
    callbackUrl: `${baseUrl}/api/auth/callback`,
    callbackExtraParams: { next },
  });
  if (!minted.ok) {
    return NextResponse.json(
      { ok: false, error: "Could not create sign-in link — try again." },
      { status: 500 },
    );
  }

  const sent = await sendAuthMagicLink({ to: email, link: minted.link });
  if (!sent.ok) {
    console.error("[chappieworks:auth-login] email send failed", sent.error);
    return NextResponse.json(
      { ok: false, error: "Could not send sign-in email — try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, message: GENERIC_OK });
}
