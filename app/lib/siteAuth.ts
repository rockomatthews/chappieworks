import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

// Token format: base64url(JSON{slug,email,exp,kind}).base64url(HMAC-SHA256)
// kind = "magic" (one-shot, ~15 min) or "session" (rolling, 30 days)

type TokenPayload =
  | { kind: "magic"; slug: string; email: string; exp: number }
  | { kind: "session"; slug: string; email: string; exp: number };

const MAGIC_TTL_MS = 15 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const OPERATOR_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function getSecret(): string {
  const s = process.env.SITE_AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SITE_AUTH_SECRET missing or too short (>=16 chars)");
  }
  return s;
}

function b64urlEncode(buf: Buffer | Uint8Array): string {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function sign(payloadB64: string): string {
  return b64urlEncode(createHmac("sha256", getSecret()).update(payloadB64).digest());
}

export function makeMagicToken(slug: string, email: string): string {
  const payload: TokenPayload = {
    kind: "magic",
    slug,
    email: email.toLowerCase(),
    exp: Date.now() + MAGIC_TTL_MS,
  };
  const body = b64urlEncode(Buffer.from(JSON.stringify(payload)));
  return `${body}.${sign(body)}`;
}

export function makeSessionToken(slug: string, email: string): string {
  const payload: TokenPayload = {
    kind: "session",
    slug,
    email: email.toLowerCase(),
    exp: Date.now() + SESSION_TTL_MS,
  };
  const body = b64urlEncode(Buffer.from(JSON.stringify(payload)));
  return `${body}.${sign(body)}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = sign(body);
  const a = b64urlDecode(sig);
  const b = b64urlDecode(expected);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;
  let payload: TokenPayload;
  try {
    payload = JSON.parse(b64urlDecode(body).toString("utf8")) as TokenPayload;
  } catch {
    return null;
  }
  if (payload.exp < Date.now()) return null;
  return payload;
}

export function sessionCookieName(slug: string): string {
  return `chappie_site_${slug}`;
}

export async function readSessionFor(
  slug: string,
): Promise<{ email: string } | null> {
  const jar = await cookies();
  const c = jar.get(sessionCookieName(slug));
  if (!c) return null;
  const payload = verifyToken(c.value);
  if (!payload || payload.kind !== "session" || payload.slug !== slug) return null;
  return { email: payload.email };
}

export async function setSessionCookie(
  slug: string,
  email: string,
): Promise<void> {
  const jar = await cookies();
  jar.set(sessionCookieName(slug), makeSessionToken(slug, email), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export async function clearSessionCookie(slug: string): Promise<void> {
  const jar = await cookies();
  jar.delete(sessionCookieName(slug));
}

// Operator (studio) auth — single shared secret in env, cookie holds the
// expected value once verified.

const OPERATOR_COOKIE = "chappie_studio";

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
