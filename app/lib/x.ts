// Minimal X (Twitter) API v2 client — posts/replies as @chappieworks and reads
// public tweets, all via OAuth 1.0a user context. Dependency-free (node:crypto
// only) to keep the public-repo supply chain tight (Vault's standing rule).
// Reads four server-side env vars; never exposed to the client bundle.
//
//   X_API_KEY              consumer key
//   X_API_SECRET           consumer secret
//   X_ACCESS_TOKEN         @chappieworks access token (Read+Write)
//   X_ACCESS_TOKEN_SECRET  access token secret

import crypto from "node:crypto";

// RFC-3986 percent-encoding (stricter than encodeURIComponent).
function pct(s: string): string {
  return encodeURIComponent(s).replace(
    /[!*'()]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()
  );
}

export function hasXCreds(): boolean {
  return Boolean(
    process.env.X_API_KEY &&
      process.env.X_API_SECRET &&
      process.env.X_ACCESS_TOKEN &&
      process.env.X_ACCESS_TOKEN_SECRET
  );
}

// Build an OAuth 1.0a Authorization header. `params` are request parameters that
// MUST be part of the signature base string: query-string params for GET, form
// params for form-POST. For a JSON-body POST, pass {} — the JSON body is excluded
// from the signature by spec.
function oauth1Header(
  method: string,
  baseUrl: string,
  params: Record<string, string> = {}
): string {
  const apiKey = process.env.X_API_KEY!;
  const apiSecret = process.env.X_API_SECRET!;
  const token = process.env.X_ACCESS_TOKEN!;
  const tokenSecret = process.env.X_ACCESS_TOKEN_SECRET!;

  const oauth: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: token,
    oauth_version: "1.0",
  };

  const allParams = { ...oauth, ...params };
  const paramString = Object.keys(allParams)
    .sort()
    .map((k) => `${pct(k)}=${pct(allParams[k])}`)
    .join("&");
  const baseString = [method, pct(baseUrl), pct(paramString)].join("&");
  const signingKey = `${pct(apiSecret)}&${pct(tokenSecret)}`;
  oauth.oauth_signature = crypto
    .createHmac("sha1", signingKey)
    .update(baseString)
    .digest("base64");

  return (
    "OAuth " +
    Object.keys(oauth)
      .sort()
      .map((k) => `${pct(k)}="${pct(oauth[k])}"`)
      .join(", ")
  );
}

function requireCreds(): void {
  if (!hasXCreds()) {
    throw new Error("X credentials not set (X_API_KEY/_SECRET, X_ACCESS_TOKEN/_SECRET)");
  }
}

// Authenticated GET against the X v2 API. `query` params are signed + sent.
async function xGet<T>(baseUrl: string, query: Record<string, string> = {}): Promise<T> {
  requireCreds();
  const auth = oauth1Header("GET", baseUrl, query);
  const qs = new URLSearchParams(query).toString();
  const url = qs ? `${baseUrl}?${qs}` : baseUrl;
  const res = await fetch(url, { headers: { Authorization: auth } });
  if (!res.ok) {
    throw new Error(`X API GET ${baseUrl} ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

// Post a tweet, optionally as a reply to another tweet.
export async function postTweet(
  text: string,
  inReplyToId?: string
): Promise<{ id: string }> {
  requireCreds();
  const url = "https://api.twitter.com/2/tweets";
  const auth = oauth1Header("POST", url, {}); // JSON body excluded from signature
  const body: Record<string, unknown> = { text };
  if (inReplyToId) body.reply = { in_reply_to_tweet_id: inReplyToId };

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`X API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = (await res.json()) as { data?: { id?: string } };
  return { id: data?.data?.id ?? "" };
}

export type XTweet = { id: string; text: string; created_at?: string };

// Verify the OAuth1 credentials by asking X who we're authenticated as.
// Returns the raw status + body so we can distinguish "creds invalid / OAuth1
// not enabled" (401) from "creds valid but token is read-only" (works here, 403
// only on write).
export async function verifyCreds(): Promise<{ status: number; body: string }> {
  requireCreds();
  const url = "https://api.twitter.com/2/users/me";
  const auth = oauth1Header("GET", url, {});
  const res = await fetch(url, { headers: { Authorization: auth } });
  return { status: res.status, body: (await res.text()).slice(0, 400) };
}

// Resolve a @handle to a numeric user id.
export async function getUserId(username: string): Promise<string> {
  const data = await xGet<{ data?: { id?: string } }>(
    `https://api.twitter.com/2/users/by/username/${encodeURIComponent(username)}`
  );
  const id = data?.data?.id;
  if (!id) throw new Error(`X: no user id for @${username}`);
  return id;
}

// Recent original tweets (no retweets/replies) for a user, newest first.
export async function getUserTweets(
  userId: string,
  opts: { sinceId?: string; maxResults?: number } = {}
): Promise<XTweet[]> {
  const query: Record<string, string> = {
    max_results: String(opts.maxResults ?? 10),
    "tweet.fields": "created_at",
    exclude: "retweets,replies",
  };
  if (opts.sinceId) query.since_id = opts.sinceId;
  const data = await xGet<{ data?: XTweet[] }>(
    `https://api.twitter.com/2/users/${userId}/tweets`,
    query
  );
  return data?.data ?? [];
}
