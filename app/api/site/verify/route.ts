import { NextResponse } from "next/server";
import { readSite } from "../../../lib/sites";
import { verifyToken, setSessionCookie } from "../../../lib/siteAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chappieworks.com";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  if (!token) {
    return NextResponse.redirect(`${BASE_URL}/site?error=missing`);
  }
  const payload = verifyToken(token);
  if (!payload || payload.kind !== "magic") {
    return NextResponse.redirect(`${BASE_URL}/site?error=invalid`);
  }
  const site = await readSite(payload.slug);
  if (!site || site.ownerEmail !== payload.email) {
    return NextResponse.redirect(`${BASE_URL}/site?error=invalid`);
  }
  await setSessionCookie(payload.slug, payload.email);
  return NextResponse.redirect(`${BASE_URL}/site/${payload.slug}`);
}
