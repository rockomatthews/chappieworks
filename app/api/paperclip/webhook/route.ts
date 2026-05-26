import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import crypto from "node:crypto";

// Phase 2 hook: deployed Paperclip POSTs here when a project or issue changes.
// Body is the Paperclip event payload (we don't parse it — only need to know
// _something_ changed). HMAC signature in X-Paperclip-Signature verifies the
// sender holds PAPERCLIP_WEBHOOK_SECRET. On valid sig, revalidate the cached
// /studio/queue page so the next request fetches fresh Paperclip data.

export const runtime = "nodejs";

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const secret = process.env.PAPERCLIP_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "not-configured" }, { status: 503 });
  }
  const signature = req.headers.get("x-paperclip-signature") ?? "";
  const body = await req.text();
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  if (!timingSafeEqualHex(signature, expected)) {
    return NextResponse.json({ ok: false, error: "bad-signature" }, { status: 401 });
  }
  revalidatePath("/studio/queue");
  return NextResponse.json({ ok: true, revalidated: "/studio/queue" });
}
