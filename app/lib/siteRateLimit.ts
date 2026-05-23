import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Result = { ok: true } | { ok: false; reason: "burst" | "hour" | "day"; retryAfterSec: number };

let cachedClient: {
  burst: Ratelimit;
  hour: Ratelimit;
  day: Ratelimit;
} | null = null;

function clients() {
  if (cachedClient) return cachedClient;
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const redis = new Redis({ url, token });
  cachedClient = {
    burst: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(1, "60 s"), prefix: "site-login:burst" }),
    hour: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 h"), prefix: "site-login:hour" }),
    day: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "1 d"), prefix: "site-login:day" }),
  };
  return cachedClient;
}

export async function checkLoginRateLimit(slug: string, email: string): Promise<Result> {
  const c = clients();
  if (!c) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[chappieworks:site-rate-limit] Upstash env missing — failing open");
    }
    return { ok: true };
  }
  const key = `${slug}:${email}`;
  const now = Date.now();
  const [burst, hour, day] = await Promise.all([c.burst.limit(key), c.hour.limit(key), c.day.limit(key)]);
  if (!burst.success) return { ok: false, reason: "burst", retryAfterSec: secsUntil(burst.reset, now) };
  if (!hour.success) return { ok: false, reason: "hour", retryAfterSec: secsUntil(hour.reset, now) };
  if (!day.success) return { ok: false, reason: "day", retryAfterSec: secsUntil(day.reset, now) };
  return { ok: true };
}

function secsUntil(resetMs: number, nowMs: number): number {
  return Math.max(1, Math.ceil((resetMs - nowMs) / 1000));
}
