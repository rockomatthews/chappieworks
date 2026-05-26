# Supabase setup — Phase 1 (auth only)

Customer auth for `/site/{slug}` was migrated from custom HMAC magic links + Vercel Blob session cookies → Supabase Auth on 2026-05-25.

Phase 1 swaps the auth layer only. Site records + chat messages still live in Vercel Blob. Phase 2 (post coin launch) moves both into Postgres.

## Why we swapped

The custom magic-link flow had three live bugs (see `REVIEW_DASHBOARD_2026-05-23.md`):

- **C-3** — Email security scanners pre-fetched magic-link GETs, consuming tokens before the human clicked.
- **C-7** — No atomic append (blob read-modify-write race).
- **C-8** — Login response timing leaked slug+email pair matches.

Supabase Auth handles consume-once enforcement, rate limiting, and timing-safe verification out of the box.

## Env vars (all 3 environments)

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>     # server-side only
```

`NEXT_PUBLIC_*` are safe to expose to the browser. `SUPABASE_SERVICE_ROLE_KEY` is server-only — it bypasses RLS and can mint magic links.

## One-time Supabase dashboard config

1. **Authentication → URL Configuration**
   - Site URL: `https://chappieworks.com`
   - Redirect URLs (allowlist): add `https://chappieworks.com/api/site/auth/confirm` and `http://localhost:3000/api/site/auth/confirm`
2. **Authentication → Providers → Email** — confirm enabled. Default is enabled.
3. *(Optional)* **Authentication → Email Templates** — irrelevant for us; we send custom Resend-branded emails via `admin.generateLink` and never trigger Supabase's built-in mailer.

## Flow

### Sign-in (returning customer)

1. Customer hits `/site/{slug}` → unauthenticated → sees `SiteLogin` form.
2. POST `/api/site/auth/login` with `{slug, email}`.
3. Server validates `(slug, email)` against the Blob index, rate-limit-checks, then:
   - `supabase.auth.admin.createUser({ email, email_confirm: true })` (idempotent — swallows "already exists").
   - `supabase.auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo: '/api/site/auth/confirm?slug=...' } })`.
4. Server emails the link via Resend (`sendMagicLink` in `app/lib/siteNotify.ts`).
5. Customer clicks → GET `/api/site/auth/confirm?token_hash=...&type=magiclink&slug=...`.
6. Server calls `supabase.auth.verifyOtp({ token_hash, type })` → Supabase consumes the token and sets the session cookies via the SSR client.
7. Server verifies `user.email === site.ownerEmail` then redirects to `/site/{slug}`.

### Welcome email (new customer)

`app/actions/intake.ts:provisionSiteFromBrief` mints the link via `mintSiteMagicLink` (same helper as login). User is auto-created in Supabase Auth at the same time.

### Sign out

POST `/api/site/auth/logout` → `supabase.auth.signOut()`.

## Code map

| File | Purpose |
| --- | --- |
| `app/lib/supabase/server.ts` | SSR server client (reads/writes cookies). |
| `app/lib/supabase/admin.ts` | Service-role client (server-only). |
| `app/lib/supabase/middleware.ts` | Refreshes the access token on every protected request. |
| `app/lib/supabase/magiclink.ts` | `mintSiteMagicLink(email, slug, baseUrl)` — create-if-needed + generate. |
| `middleware.ts` | Runs `updateSupabaseSession` on `/site/*` and `/api/site/{auth,message,draft}/*`. |
| `app/api/site/auth/login/route.ts` | POST — sends magic link via Resend. |
| `app/api/site/auth/confirm/route.ts` | GET — verifies token, sets session, redirects. |
| `app/api/site/auth/logout/route.ts` | POST — `signOut()`. |

## What did NOT change

- Operator (studio) auth still uses `STUDIO_OPERATOR_TOKEN` env + cookie. See `app/lib/siteAuth.ts`.
- Site records still live in Vercel Blob (`app/lib/sites.ts`).
- The Resend-branded email templates are unchanged in look and feel.

## Phase 2 (queued — after coin launch)

Move `sites` + `site_messages` into Postgres tables with row-level security keyed off `auth.jwt() ->> 'email'`. Schema sketch:

```sql
create table public.sites (
  slug text primary key,
  owner_email text not null,
  owner_name text,
  business_name text,
  brief text,
  status text default 'received',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on public.sites (lower(owner_email));

create table public.site_messages (
  id uuid primary key default gen_random_uuid(),
  slug text not null references public.sites(slug) on delete cascade,
  role text not null check (role in ('customer','studio','system')),
  body text not null,
  created_at timestamptz default now()
);
create index on public.site_messages (slug, created_at);
```

That fixes C-1 (Blob URL leakage), C-2 (`_index.json` exposure), and C-7 (race) in one move.
