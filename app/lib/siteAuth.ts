import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

// Operator (studio) auth — single shared secret in env, cookie holds the
// expected value once verified. Customer-side auth moved to Supabase
// (see app/lib/supabase/*).

const OPERATOR_COOKIE = "chappie_studio";
const OPERATOR_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function isOperator(): Promise<boolean> {
  const expected = process.env.STUDIO_OPERATOR_TOKEN;
  if (!expected) return false;
  const jar = await cookies();
  const c = jar.get(OPERATOR_COOKIE);
  if (!c) return false;
  const a = Buffer.from(c.value);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function setOperatorCookie(token: string): Promise<boolean> {
  const expected = process.env.STUDIO_OPERATOR_TOKEN;
  if (!expected) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  if (!timingSafeEqual(a, b)) return false;
  const jar = await cookies();
  jar.set(OPERATOR_COOKIE, expected, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(OPERATOR_TTL_MS / 1000),
  });
  return true;
}

export async function clearOperatorCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(OPERATOR_COOKIE);
}
