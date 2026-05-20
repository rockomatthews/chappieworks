import { NextResponse } from "next/server";
import { setOperatorCookie } from "../../../lib/siteAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let parsed: { token?: string };
  try {
    parsed = (await req.json()) as { token?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 });
  }
  const token = (parsed.token ?? "").trim();
  if (!token) {
    return NextResponse.json({ ok: false, error: "Missing token" }, { status: 400 });
  }
  const ok = await setOperatorCookie(token);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "Bad token" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
