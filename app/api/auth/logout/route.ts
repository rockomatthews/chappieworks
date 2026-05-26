import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://chappieworks.com";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(BASE_URL);
}
