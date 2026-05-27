import { NextResponse } from "next/server";
import { createSite } from "../../../lib/sites";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

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

  return NextResponse.json({ ok: true, slug: site.slug });
}
