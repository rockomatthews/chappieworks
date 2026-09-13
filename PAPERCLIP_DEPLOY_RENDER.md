# Deploy Paperclip to Render — hand-off

**Goal:** stand up a public `paperclip.chappieworks.com` so chappieworks.com/studio/queue can read live from it.

**Status:** Phase 1 code is shipped (app/lib/paperclip.ts, queue page refactor, webhook handler). Backfill ran against your local Paperclip (11 projects, 70 issues). This doc is the deployment step that turns it on in production.

---

## ⚠ VERIFIED FACTS (2026-06-03) — read before following the steps below

Pulled from the live local instance + the real Paperclip repo (`github.com/paperclipai/paperclip`, branch `master`). These **override** any guesses further down:

- **Local install is DONE and healthy.** Paperclip runs at `http://localhost:3100` (data in `~/.paperclip/instances/default/`). The `Chappieworks` company exists (`2d9f539d-…`, prefix `CHA`, 70 issues), all 11 queue projects backfilled with `[queue:…][lead:…]` description tags. `app/lib/paperclip.ts` reads it correctly — verified: `/studio/queue` renders a **live read** when `PAPERCLIP_URL=http://localhost:3100` is set. The only thing missing is exposing it to Vercel.
- **Deploy with Docker, not pnpm guesses.** The repo ships a `Dockerfile` (base `node:lts-trixie-slim`, multi-stage, `EXPOSE 3100`, entrypoint runs `server/dist/index.js` via tsx). On Render: **New → Web Service → Runtime: Docker**. Ignore the "Build/Start command" guesses in Step 1.
- **Real env vars** (from `.env.example`): `DATABASE_URL` (postgres), `PORT=3100`, `SERVE_UI` (set `true` to serve the Paperclip web UI), `BETTER_AUTH_SECRET` (long random), optional `DISCORD_WEBHOOK_URL`. There is **no** `PAPERCLIP_DEPLOYMENT_MODE` and **no** `PAPERCLIP_API_KEY` — those lines below are fiction.
- **AUTH MODEL IS THE REAL DECISION.** Production auth is [better-auth](https://better-auth.com) (sessions + agent API keys + short-lived run JWTs), **not** a static `X-API-Key` header. Locally it's open because loopback = trusted mode. So once it's public you must pick an access model for the read:
  1. **Public read** — leave GET endpoints open (matches Sire's "public read-only queue" lean). Simplest; the reader works as-is with no key. Must confirm GETs are reachable un-authenticated in non-loopback mode, and that **writes stay gated** so randos can't create issues.
  2. **Network gate** — put it behind Cloudflare Tunnel + Cloudflare Access (service token), an IP allowlist, or a thin reverse-proxy that checks a shared secret. The reader's `X-API-Key` header in `paperclip.ts` would change to whatever the gate expects.
  - Either way, **`app/lib/paperclip.ts` likely needs an auth tweak** before prod — its current `X-API-Key` assumption won't match better-auth.
- **Simpler alternative to Render — Option C (tunnel), now first-class.** Paperclip natively supports `--bind tailnet`. A **Tailscale Funnel** (or Cloudflare Tunnel) can expose the *existing* local instance — which already has all the real data — at a public HTTPS URL with no redeploy, no external Postgres, no data migration, and no divergence from the source of truth. Tradeoff: your machine must be up. Given the auth complexity above, this is worth comparing against the full Render deploy before committing.
- **Data migration note:** the local embedded Postgres already holds everything (11 projects, 70 issues, issue counter at 70). For a Render deploy, `pg_dump` the local instance → restore into Render Postgres is cleaner than re-running the backfill (preserves CHA-* numbering). Re-running the backfill also requires the prod instance to accept un-authenticated writes, which the auth model may block.

---

---

## ✅ EXECUTABLE RENDER STEPS (verified 2026-06-03 — supersedes Steps 1–6 below)

**Architecture (verified from `doc/DOCKER.md`):** the Paperclip Docker image runs its **own embedded
Postgres inside the container**, persisted to a volume at `/paperclip`. So you do **NOT** need a
separate Render Postgres — just one Web Service + one persistent disk. (Step 2 below is obsolete.)

1. **Repo → Render.** New → Web Service → connect `github.com/paperclipai/paperclip` (fork it to pin a
   SHA you trust). **Runtime: Docker** (repo ships a Dockerfile, `EXPOSE 3100`). Region: Oregon.
2. **Plan: Starter ($7/mo).** Never Free — it sleeps after 15 min idle and kills the live read.
3. **Persistent disk** (critical): service → Disks → Add Disk, mount path **`/paperclip`**, 1–5 GB.
   Without it, every deploy wipes the embedded DB.
4. **Env vars:**
   - `HOST=0.0.0.0`
   - `PAPERCLIP_HOME=/paperclip`
   - `PAPERCLIP_PUBLIC_URL=https://paperclip.chappieworks.com`
   - `BETTER_AUTH_SECRET=` ← `openssl rand -hex 32`
   - `PAPERCLIP_DEPLOYMENT_MODE=authenticated`
   - `PAPERCLIP_DEPLOYMENT_EXPOSURE=public`
   - `ANTHROPIC_API_KEY=` ← only if you want the *hosted* instance to run agents; not needed just to
     serve the queue read.
5. **Custom domain + DNS:** add `paperclip.chappieworks.com` in Render → CNAME it in DNS (proxy off
   until the cert issues).
6. **Bootstrap the admin:** via Render Shell, run the repo's CEO bootstrap (`pnpm paperclipai auth
   bootstrap-ceo`) to claim the instance — this is how you later mint the reader token.
7. **Migrate the studio data — two options:**
   - **A (preserve CHA-* numbering):** `pg_dump` the local instance (embedded PG at
     `127.0.0.1:54329`, user/db `paperclip`): `pg_dump -h 127.0.0.1 -p 54329 -U paperclip paperclip >
     paperclip.sql`, then restore into the container's embedded PG via Render Shell. Cleanest fidelity.
   - **B (fresh):** point `scripts/paperclip-backfill.py` `API=` at `https://paperclip.chappieworks.com/api`,
     add the auth header, run it + `paperclip-set-statuses.py`. Needs the prod instance to accept
     authenticated writes.
8. **Mint the reader token + wire Vercel** (`chappieworks` env, Prod+Preview+Dev):
   - `PAPERCLIP_URL=https://paperclip.chappieworks.com`
   - `PAPERCLIP_API_KEY=<token from the bootstrapped instance>`
   - `NEXT_PUBLIC_PAPERCLIP_URL=https://paperclip.chappieworks.com`
   - `PAPERCLIP_WEBHOOK_SECRET=<random>` (for the webhook revalidate path)
   - `PAPERCLIP_AUTH_HEADER` / `PAPERCLIP_AUTH_SCHEME` — set **only** if the instance wants something
     other than `Authorization: Bearer <token>`. `app/lib/paperclip.ts` now defaults to that and reads
     these env overrides, so prod auth can be matched **without a code change**.
   - Redeploy.
9. **Verify:** `/studio/queue` shows the "live read" copy + 11 projects; flip a status in Paperclip →
   propagates within 60s (instant once the webhook hits `/api/paperclip/webhook`).

**Two unknowns to confirm against the running instance (not blockers):**
- Whether `PAPERCLIP_DEPLOYMENT_EXPOSURE=public` leaves GET endpoints open (no token needed) or still
  wants a Bearer token. The reader handles both (`PAPERCLIP_API_KEY` is optional).
- The exact command/UI to mint an external read token under better-auth.

---

## Prereqs (~2 min)

- Render account ([render.com](https://render.com)) — free signup, pay-as-you-go after the first service
- Cloudflare/Vercel access for `chappieworks.com` DNS (you already have this)
- The Paperclip GitHub repo URL (per the Multica recon doc, Paperclip is self-hostable — confirm the canonical repo if it's different from what we noted)

---

## Step 1 — Deploy the Render service (~10 min)

1. **Dashboard → New → Web Service** at [dashboard.render.com](https://dashboard.render.com)
2. Connect the Paperclip GitHub repo (fork it first if you want to pin a SHA you trust)
3. Settings:
   - **Name:** `paperclip-chappieworks`
   - **Region:** Oregon (Vercel's primary West region — minimizes hop latency)
   - **Branch:** `main` (or a pinned SHA tag)
   - **Build command:** per Paperclip's README (likely `pnpm install && pnpm build`)
   - **Start command:** per Paperclip's README (likely `pnpm start`)
   - **Plan:** Starter ($7/mo) — Free tier sleeps after 15 min idle which would break the live read
4. **Env vars** (Render → Environment):
   - `NODE_ENV=production`
   - `DATABASE_URL=<postgres URL>` — see Step 2
   - `PAPERCLIP_DEPLOYMENT_MODE=production` (or whatever value disables `local_trusted`)
   - `PAPERCLIP_API_KEY=<generate a long random string — `openssl rand -hex 32`>`
   - `PAPERCLIP_WEBHOOK_SECRET=<another random string>`
   - Anything else Paperclip's README requires (LLM API keys, etc.)

## Step 2 — Add Postgres (~5 min)

Paperclip needs Postgres 17+ with pgvector. Two options:

**Option A (recommended): Render Managed Postgres**
- Dashboard → New → PostgreSQL
- Plan: Starter ($7/mo, 1 GB, supports pgvector)
- Region: Oregon (same as the web service)
- After provisioning, copy the **internal** Database URL (faster + free egress)
- Paste it into the web service's `DATABASE_URL` env var

**Option B: Supabase free tier** — already exists in chappieworks, free up to 500 MB
- New Supabase project at supabase.com/dashboard
- Settings → Database → Connection string → copy the pooler URL (port 6543)
- Paste into Render `DATABASE_URL`
- Run `CREATE EXTENSION IF NOT EXISTS vector;` in Supabase SQL editor

## Step 3 — Custom domain (~5 min)

1. Render → Service → Settings → Custom Domain → add `paperclip.chappieworks.com`
2. Render gives you a CNAME target like `paperclip-chappieworks.onrender.com`
3. In your DNS (Cloudflare or Vercel), add:
   - Type: `CNAME`
   - Name: `paperclip`
   - Target: `<the Render CNAME target>`
   - Proxy: Off (Cloudflare) so Render can complete cert issuance
4. Wait for Render to verify + issue Let's Encrypt cert (~1–5 min)

## Step 4 — Migrate data from local Paperclip (~10 min)

You already have 11 projects + 65 issues in local Paperclip from today's backfill. Two options:

**Option A (cleanest):** re-run the backfill script against the new instance
- Edit `scripts/paperclip-backfill.py` line 14 — change `API = "http://localhost:3100/api"` to `API = "https://paperclip.chappieworks.com/api"`
- Add `X-API-Key` header in the `http()` function — it's already structured to make this an easy ~3-line edit
- Run `python3 scripts/paperclip-backfill.py` once against prod
- Run `python3 scripts/paperclip-set-statuses.py` for the status + lead-persona pass

**Option B:** dump-restore from local Postgres
- Useful if you've already added rich detail in local Paperclip you don't want to lose
- `pg_dump` from local → `psql` into Render Postgres
- Requires knowing Paperclip's exact schema; A is safer for first deploy

## Step 5 — Wire chappieworks.com (~3 min)

In Vercel project `chappieworks` → Settings → Environment Variables, add for **Production + Preview + Development**:

```
PAPERCLIP_URL=https://paperclip.chappieworks.com
PAPERCLIP_API_KEY=<the same key you set in Render>
PAPERCLIP_WEBHOOK_SECRET=<the same webhook secret>
NEXT_PUBLIC_PAPERCLIP_URL=https://paperclip.chappieworks.com
```

Click **Redeploy** on the most recent prod deploy (or push any commit) to bake the env in.

**Verify:**
- `https://chappieworks.com/studio/queue` should now show the **"Source of truth is paperclip.ing"** copy at the top
- The page should match the 11 projects you see at `https://paperclip.chappieworks.com`
- If you see the **"Source of truth is the studio's persistent memory"** copy instead, the fallback kicked in — check Vercel function logs for "paperclip fetchStudioQueue failed" messages

## Step 6 — Wire webhook out (~3 min)

In the Render-deployed Paperclip:

1. Find the webhook config (usually in admin settings or a `webhooks.json`)
2. Add:
   - **URL:** `https://chappieworks.com/api/paperclip/webhook`
   - **Events:** `project.*`, `issue.*` (or whatever the Paperclip event taxonomy is)
   - **Secret:** the `PAPERCLIP_WEBHOOK_SECRET` value
   - **Algorithm:** HMAC-SHA256 (verifies signature in `X-Paperclip-Signature` header)
3. Test by changing a project status in Paperclip → check Vercel function logs → confirm the webhook hit + the queue page revalidates

---

## Smoke test checklist

- [ ] `https://paperclip.chappieworks.com/api/health` returns 200
- [ ] `https://paperclip.chappieworks.com/api/companies` returns the chappieworks company (after migration)
- [ ] `https://chappieworks.com/studio/queue` shows 11 projects with persona badges + the "paperclip.ing" attribution
- [ ] Editing a project in Paperclip propagates to chappieworks.com within ~60s (revalidate window) or instantly (after webhook is wired)
- [ ] Removing `PAPERCLIP_URL` from Vercel env + redeploying makes the page fall back to the static QUEUE constant (graceful degradation works)

---

## Cost summary

| Item | Plan | Cost |
|---|---|---|
| Render web service | Starter | $7/mo |
| Render Postgres | Starter | $7/mo (or $0 on Supabase free tier) |
| `paperclip.chappieworks.com` DNS | n/a | $0 |
| Vercel envs + redeploy | existing plan | $0 |
| **Total** | | **$7–14/mo** |

---

## Rollback

If Paperclip starts misbehaving and the queue page goes blank (it shouldn't — there's a static fallback — but if):

1. In Vercel → Project → Environment → delete `PAPERCLIP_URL`
2. Redeploy
3. Page reverts to the static `QUEUE` constant baked into `app/studio/queue/page.tsx`. Same as before this integration.

The static array is preserved forever as the safety net.
