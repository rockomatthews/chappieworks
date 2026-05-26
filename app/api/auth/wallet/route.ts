import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAddress(s: unknown): s is string {
  return (
    typeof s === "string" &&
    /^0x[0-9a-fA-F]{40}$/.test(s)
  );
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Not signed in" },
      { status: 401 },
    );
  }

  let body: { address?: string };
  try {
    body = (await req.json()) as { address?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 });
  }
  if (!isAddress(body.address)) {
    return NextResponse.json(
      { ok: false, error: "Invalid address" },
      { status: 400 },
    );
  }

  const address = body.address.toLowerCase();
  const { error } = await supabase.auth.updateUser({
    data: { wallet_address: address },
  });
  if (error) {
    console.error("[chappieworks:wallet-link] updateUser failed", error.message);
    return NextResponse.json(
      { ok: false, error: "Could not link wallet — try again." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, address });
}

export async function DELETE() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Not signed in" },
      { status: 401 },
    );
  }
  const { error } = await supabase.auth.updateUser({
    data: { wallet_address: null },
  });
  if (error) {
    return NextResponse.json(
      { ok: false, error: "Could not unlink wallet." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
