# Deploy Paperclip to Render — hand-off

**Goal:** stand up a public `paperclip.chappieworks.com` so chappieworks.com/studio/queue can read live from it.

**Status:** Phase 1 code is shipped (app/lib/paperclip.ts, queue page refactor, webhook handler). Backfill ran against your local Paperclip (11 projects, 65 issues). This doc is the deployment step that turns it on in production.

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
