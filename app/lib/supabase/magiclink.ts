import { supabaseAdmin } from "./admin";

export type MagicLinkResult =
  | { ok: true; link: string }
  | { ok: false; error: string };

// Generic: mint a Supabase magic link that lands at OUR callback URL.
// Idempotently creates the user (email_confirm: true skips the verification
// dance — we trust whoever's clicking the link in their own inbox).
export async function mintMagicLink(opts: {
  email: string;
  callbackUrl: string;  // full URL, e.g. https://chappieworks.com/api/auth/callback
  callbackExtraParams?: Record<string, string>;  // extra ?k=v appended on the OUR-URL we email
}): Promise<MagicLinkResult> {
  const { email, callbackUrl, callbackExtraParams } = opts;
  const admin = supabaseAdmin();

  const created = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (
    created.error &&
    !/already.*registered|user.*exists|email.*exists/i.test(created.error.message)
  ) {
    console.error(
      "[chappieworks:magiclink] createUser failed",
      created.error.message,
    );
    return { ok: false, error: created.error.message };
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: callbackUrl,
    },
  });
  if (error || !data?.properties?.hashed_token) {
    console.error(
      "[chappieworks:magiclink] generateLink failed",
      error?.message,
    );
    return { ok: false, error: error?.message ?? "no hashed_token" };
  }

  const params = new URLSearchParams({
    token_hash: data.properties.hashed_token,
    type: "magiclink",
    ...(callbackExtraParams ?? {}),
  });
  const link = `${callbackUrl}?${params.toString()}`;

  return { ok: true, link };
}

// Slug-locked variant for the /site/{slug} customer dashboard flow.
export async function mintSiteMagicLink(opts: {
  email: string;
  slug: string;
  baseUrl: string;
}): Promise<MagicLinkResult> {
  return mintMagicLink({
    email: opts.email,
    callbackUrl: `${opts.baseUrl}/api/site/auth/confirm`,
    callbackExtraParams: { slug: opts.slug },
  });
}
