// Minimal X (Twitter) API v2 client — posts a tweet as @chappieworks via OAuth 1.0a
// user context. Dependency-free (node:crypto only) to keep the public-repo supply
// chain tight (Vault's standing rule). Reads four server-side env vars; never
// exposed to the client bundle.
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

export async function postTweet(text: string): Promise<{ id: string }> {
  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;
  const token = process.env.X_ACCESS_TOKEN;
  const tokenSecret = process.env.X_ACCESS_TOKEN_SECRET;
  if (!apiKey || !apiSecret || !token || !tokenSecret) {
    throw new Error("X credentials not set (X_API_KEY/_SECRET, X_ACCESS_TOKEN/_SECRET)");
  }

  const url = "https://api.twitter.com/2/tweets";
  const method = "POST";

  // For a JSON-body POST to the v2 endpoint, only the OAuth params form the
  // signature base string (no query params; the JSON body is not form-encoded
  // and is excluded by spec).
  const oauth: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: token,
    oauth_version: "1.0",
  };

  const paramString = Object.keys(oauth)
    .sort()
    .map((k) => `${pct(k)}=${pct(oauth[k])}`)
    .join("&");
  const baseString = [method, pct(url), pct(paramString)].join("&");
  const signingKey = `${pct(apiSecret)}&${pct(tokenSecret)}`;
  oauth.oauth_signature = crypto
    .createHmac("sha1", signingKey)
    .update(baseString)
    .digest("base64");

  const authHeader =
    "OAuth " +
    Object.keys(oauth)
      .sort()
      .map((k) => `${pct(k)}="${pct(oauth[k])}"`)
      .join(", ");

  const res = await fetch(url, {
    method,
    headers: { Authorization: authHeader, "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`X API ${res.status}: ${err.slice(0, 300)}`);
  }

  const data = (await res.json()) as { data?: { id?: string } };
  return { id: data?.data?.id ?? "" };
}
