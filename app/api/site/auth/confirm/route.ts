import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";
import { readSite } from "../../../../lib/sites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://chappieworks.com";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const slug = url.searchParams.get("slug") ?? "";

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${BASE_URL}/site?error=missing`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });
  if (error) {
    console.error(
      "[chappieworks:site-auth-confirm] verifyOtp failed",
      error.message,
    );
    return NextResponse.redirect(`${BASE_URL}/site?error=invalid`);
  }

  if (!slug) {
    return NextResponse.redirect(`${BASE_URL}/site`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.redirect(`${BASE_URL}/site?error=invalid`);
  }

  const site = await readSite(slug);
  const sessionEmail = user.email.toLowerCase();
  if (!site || site.ownerEmail !== sessionEmail) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${BASE_URL}/site?error=invalid`);
  }

  return NextResponse.redirect(`${BASE_URL}/site/${slug}`);
}
