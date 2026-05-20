import { NextResponse } from "next/server";
import { clearSessionCookie } from "../../../lib/siteAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let parsed: { slug?: string };
  try {
    parsed = (await req.json()) as { slug?: string };
  } catch {
    parsed = {};
  }
  const slug = (parsed.slug ?? "").trim();
  if (!slug) return NextResponse.json({ ok: false, error: "No slug" }, { status: 400 });
  await clearSessionCookie(slug);
  return NextResponse.json({ ok: true });
}
