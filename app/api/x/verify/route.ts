import { NextResponse } from "next/server";
import { verifyCreds, hasXCreds } from "@/app/lib/x";

// Diagnostic: confirms whether the X OAuth1 credentials authenticate at all.
// Gated by CRON_SECRET or X_AUTOPOST_TOKEN. Returns X's raw answer.
//   200 + the @handle  => creds valid + OAuth1 enabled. (A write 403 then means
//                          the access token is Read-only — regenerate as R+W.)
//   401                => creds invalid OR OAuth 1.0a not enabled on the app.
function isAuthorized(req: Request): boolean {
  const auth = req.headers.get("authorization");
  const cron = process.env.CRON_SECRET;
  const autopost = process.env.X_AUTOPOST_TOKEN;
  if (cron && auth === `Bearer ${cron}`) return true;
  if (autopost && auth === `Bearer ${autopost}`) return true;
  return false;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasXCreds()) {
    return NextResponse.json({ ok: false, reason: "no-x-creds" });
  }
  try {
    const { status, body } = await verifyCreds();
    return NextResponse.json({ ok: status === 200, xStatus: status, xBody: body });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
