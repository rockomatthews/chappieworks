import type { NextRequest } from "next/server";
import { updateSupabaseSession } from "./app/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSupabaseSession(request);
}

export const config = {
  matcher: [
    "/",
    "/account/:path*",
    "/signin",
    "/site/:path*",
    "/api/site/auth/:path*",
    "/api/site/message/:path*",
    "/api/site/draft/:path*",
    "/api/auth/:path*",
  ],
};
