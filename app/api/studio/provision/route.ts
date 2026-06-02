import { NextResponse } from "next/server";
import { createSite } from "../../../lib/sites";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { mintSiteMagicLink } from "../../../lib/supabase/magiclink";
import { sendWelcomeDashboard } from "../../../lib/siteNotify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAdminEmail(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export async function POST(req: Request) {
  let email: string | undefined;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email?.toLowerCase();
  } catch {
    return NextResponse.json({ ok: false, error: "Auth unavailable" }, { status: 503 });
  }

  if (!email || !isAdminEmail(email)) {
    return NextResponse.json({ ok: false, error: "Not authorized" }, { status: 401 });
  }

  let parsed: {
    ownerEmail?: string;
    ownerName?: string;
    businessName?: string;
    brief?: string;
    liveUrl?: string;
  };
  try {
    parsed = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 });
  }

  const ownerEmail = (parsed.ownerEmail ?? "").trim();
  const ownerName = (parsed.ownerName ?? "").trim();
  const businessName = (parsed.businessName ?? "").trim();
  if (!ownerEmail || !ownerName || !businessName) {
    return NextResponse.json(
      { ok: false, error: "ownerEmail, ownerName, businessName required" },
      { status: 400 },
    );
  }

  const site = await createSite({
    ownerEmail,
    ownerName,
    businessName,
    brief: parsed.brief,
    liveUrl: parsed.liveUrl,
  });

  // Auto-send welcome email with magic link so the admin doesn't have to do it manually.
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chappieworks.com";
  let welcomed = false;
  try {
    const minted = await mintSiteMagicLink({ email: ownerEmail, slug: site.slug, baseUrl });
    if (minted.ok) {
      const sent = await sendWelcomeDashboard({
        to: ownerEmail,
        slug: site.slug,
        link: minted.link,
        businessName,
        ownerName,
      });
      welcomed = sent.ok;
      if (!sent.ok) {
        console.warn("[chappieworks:provision] welcome email failed", sent.error);
      }
    } else {
      console.warn("[chappieworks:provision] mint magic link failed", minted.error);
    }
  } catch (err) {
    console.error("[chappieworks:provision] welcome email threw", err);
  }

  return NextResponse.json({ ok: true, slug: site.slug, welcomed });
}
