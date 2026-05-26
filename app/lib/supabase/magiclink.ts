import { supabaseAdmin } from "./admin";

export type MagicLinkResult =
  | { ok: true; link: string }
  | { ok: false; error: string };

// Mints a Supabase magic link that lands at our /api/site/auth/confirm route.
// Idempotently creates the Supabase user if it doesn't exist yet — the
// dashboard's customers are already vetted (they bought a site), so we mark
// their email as confirmed up front.
export async function mintSiteMagicLink(opts: {
  email: string;
  slug: string;
  baseUrl: string;
}): Promise<MagicLinkResult> {
  const { email, slug, baseUrl } = opts;
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
      redirectTo: `${baseUrl}/api/site/auth/confirm?slug=${encodeURIComponent(slug)}`,
    },
  });
  if (error || !data?.properties?.hashed_token) {
    console.error(
      "[chappieworks:magiclink] generateLink failed",
      error?.message,
    );
    return { ok: false, error: error?.message ?? "no hashed_token" };
  }

  const link = `${baseUrl}/api/site/auth/confirm?token_hash=${encodeURIComponent(
    data.properties.hashed_token,
  )}&type=magiclink&slug=${encodeURIComponent(slug)}`;

  return { ok: true, link };
}
