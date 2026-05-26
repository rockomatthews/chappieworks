import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://chappieworks.com";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const nextParam = url.searchParams.get("next");
  const next =
    nextParam && nextParam.startsWith("/") ? nextParam : "/studio";

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${BASE_URL}/signin?error=missing`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });
  if (error) {
    console.error(
      "[chappieworks:auth-callback] verifyOtp failed",
      error.message,
    );
    return NextResponse.redirect(`${BASE_URL}/signin?error=invalid`);
  }

  return NextResponse.redirect(`${BASE_URL}${next}`);
}
