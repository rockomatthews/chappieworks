# Render — Friday deploy checklist (Paperclip + Multica)

**Scheduled:** next Friday. **Starting point:** you have only a Render *profile* (no services, maybe no
payment method yet). This is the single combined list for both deploys.

---

## 0 · Account setup (once, ~3 min) — do this first

- [ ] **Add a payment method** — Render → Account Settings → Billing. Required before any non-free
      service (both Paperclip and Multica use paid Starter services).
- [ ] *(Optional)* Create a **Project/workspace** in Render to group these (e.g. "Chappie Studio") so
      the 5 services don't clutter your dashboard.

---

## A · Paperclip — the studio queue's system of record (~25 min)

Everything is pre-staged: the fork `github.com/rockomatthews/paperclip` has a `render.yaml` Blueprint,
and the Vercel env vars are already set (`PAPERCLIP_URL`, `NEXT_PUBLIC_PAPERCLIP_URL`,
`PAPERCLIP_WEBHOOK_SECRET`). Full detail in `PAPERCLIP_DEPLOY_RENDER.md`.

- [ ] **Render → New → Blueprint → connect `rockomatthews/paperclip` → Apply.** The Blueprint creates
      the `paperclip-chappieworks` web service (Docker, Starter), the `/paperclip` disk (5 GB), and all
      env vars. `BETTER_AUTH_SECRET` auto-generates; leave `ANTHROPIC_API_KEY` blank unless you want the
      *hosted* instance to run agents.
- [ ] **Custom domain:** service → Settings → add `paperclip.chappieworks.com` → copy the CNAME target →
      add that CNAME in your DNS (proxy off until the cert issues).
- [ ] **Bootstrap admin:** service → Shell → run the CEO bootstrap (`pnpm paperclipai auth bootstrap-ceo`)
      → mint a read token for the site.
- [ ] **Migrate the data** (preserves CHA-* numbering): from your Mac,
      `pg_dump -h 127.0.0.1 -p 54329 -U paperclip paperclip > paperclip.sql`, then restore into the
      container's embedded Postgres via Render Shell. (Or re-run `scripts/paperclip-backfill.py` against
      the new URL — see runbook.)
- [ ] **Wire the token:** in Vercel → chappieworks → add `PAPERCLIP_API_KEY=<the read token>` → redeploy.
- [ ] **Merge PR #1** (`studio/paperclip-prod`) so the env-driven reader ships.
- [ ] **Verify:** `chappieworks.com/studio/queue` shows the "live read" copy + your 11 projects.

**Paperclip cost:** Starter web service $7/mo + 5 GB disk ~$1.25/mo = **~$8.25/mo**. (No separate
Postgres — it's embedded in the container on the disk.)

---

## B · Multica — Chappie squad async task board (~30 min)

Per the standup + queue: Path C (internal-only), **4 Render services, ~$28/mo**, six steps documented
in **`SIRE_DEPLOY.md`**. ⚠ That file is **not in the chappieworks repo** — it lives with the Multica
work (its own repo/workspace). Open it Friday and follow its six steps. Known shape:

- [ ] Stand up the **4 Render services** (the Multica stack: daemon/runtime container(s) + Postgres 17 +
      pgvector, per the recon — confirm exact list in `SIRE_DEPLOY.md`).
- [ ] Load the **ChappieTeam squad JSON + 3 test issues** (already prepared in the Multica artifacts).
- [ ] Wire GitHub auth as a **read-only App** (not a write-scope PAT) — per the recon's security note.
- [ ] Confirm the **Modified-Apache-2.0 / no-SaaS-resale** license constraint stays satisfied (Path C =
      internal-only, so compliant).
- [ ] Follow the remaining steps in `SIRE_DEPLOY.md`.

**Multica cost:** ~**$28/mo** (4 services).

> 📌 **If you want this section fully fleshed out**, point me at `SIRE_DEPLOY.md` (paste it or tell me
> its repo/path) and I'll fold its exact six steps into this checklist before Friday.

---

## Combined cost summary

| Stack | Services | Monthly |
|---|---|---|
| Paperclip | 1 web (Starter) + 5 GB disk | ~$8.25 |
| Multica | 4 services | ~$28 |
| **Total** | | **~$36/mo** |

DNS for `paperclip.chappieworks.com` is $0 (you own the domain). Vercel env changes are $0.

---

## One-glance Friday order of operations

1. Add Render payment method
2. Paperclip Blueprint → Apply → domain → bootstrap → migrate → wire token → merge PR #1 → verify
3. Open `SIRE_DEPLOY.md` → run Multica's six steps
4. Tell Chappie it's done — the next standup will mark both `Multica deploy` and `Paperclip integration`
   off the blocked/in-flight lists automatically.
