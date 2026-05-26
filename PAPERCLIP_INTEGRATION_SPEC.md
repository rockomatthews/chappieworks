# Paperclip integration spec — make `paperclip.ing` the studio's system of record

**Status:** scoped 2026-05-26 (post-CHAPPIE-v2-launch), not yet implemented
**Queue item:** `paperclip-integration` on `/studio/queue` (queued since 2026-05-23)
**Owner:** Sire (decisions) + Forge (implementation)

---

## What this replaces

Today `app/studio/queue/page.tsx` ships a hand-maintained `QUEUE` constant — 11 hard-coded items, status + work items inline, no live data. Every queue change is a code commit. Today only one queue item (the Chappie Site dashboard) has Paperclip ticket-level visibility — the rest is invisible to the public ledger marketed on `/studio/finance`.

Goal: `/studio/queue` becomes a live read of paperclip.ing. The hand-maintained TSX array goes away. Every persona board, every budget cap, every issue lives in Paperclip and renders into chappieworks.com surfaces.

---

## Hosting decision (DECIDE FIRST)

Local Paperclip runs at `http://localhost:3100` in `local_trusted` mode — loopback auth, no API key. Vercel-hosted chappieworks.com can't reach localhost. Three options:

| Option | What it is | Cost | Friction | Reach |
|---|---|---|---|---|
| **A — Self-host** | Run Paperclip on a Render web service / DO droplet at e.g. `paperclip.chappieworks.com`. Add an API key. Vercel reads from there. | ~$5–10/mo | One-time deploy + DNS. Need to enable API-key auth in Paperclip. | Live, public, production-grade |
| **B — Build-time fetch + webhook** | Sire's local Paperclip stays loopback-only. A GitHub Action OR Sire's machine pushes a snapshot JSON to chappieworks at build time; Paperclip webhook → Vercel deploy hook to trigger rebuild. | $0 | Fragile — depends on Sire's machine running. Snapshot diverges from reality between rebuilds. | Live within ~minutes of any change, while Sire's machine is on |
| **C — Tunnel** | Cloudflare Tunnel / Tailscale Funnel exposes localhost:3100 publicly. Vercel reads via the tunnel URL with the trusted-local key. | $0 | Tunnel must stay up. Same Sire-machine-dependency as B. | Live |

**Recommendation: A.** Costs $5/mo, no machine dependency, real production data flow. Sire's local Paperclip stays for solo work; the deployed one is the public ledger. Migrate the existing chappieworks company + Chappie Site dashboard project to the production instance once it's up.

---

## Data model mapping

### Paperclip primitives → studio surfaces

| Paperclip | Studio mapping | Notes |
|---|---|---|
| **Company** | Chappieworks (the one company we have) | Already exists: id `2d9f539d-792e-4b80-8b87-18d630ed69ac`, issuePrefix `CHA` |
| **Project** | Each `QUEUE` item from `queue/page.tsx` | One project per strategic queue line — multica-integration, paperclip-integration, gitbank-integration, etc. |
| **Issue** | Each work item bullet within a queue item | The `workItems[]` array becomes child issues under the project |
| **Status (issue)** | `backlog / todo / in_progress / in_review / done / blocked / cancelled` | Already validated as the Paperclip enum |
| **Status (project)** | New field — `in-progress / queued / shipped` | Needs custom field OR derive from issue rollup |
| **Comment** | Per-issue progress notes (Chappie voice) | Used today by the Chappie Site dashboard project — extend to all projects |
| **Label** | Persona tag — `forge / glass / scribe / vault / bench / skeptic / chappie` | One label per persona; rolls up to who owns what board |
| **Assignee (agent)** | The persona claiming the issue | Maps directly to the seven Chappie Studio personas |

### Status mapping (project rollup)

Studio queue today has 3 statuses — Paperclip's project model has no equivalent. Derive from issues:

- All issues `done` → project = **shipped**
- Any issue `in_progress` or `in_review` → project = **in-progress**
- Otherwise → project = **queued**

Override with a manual `studioStatus` field on the project (Paperclip projects have a free-form `description` we can prefix with `studio_status:shipped\n` — gross but works without a schema change).

### Persona ownership (project leads)

Per `memory/proj_chappie_studio_personas.md`:

| Persona | Owns projects of type | Current QUEUE items |
|---|---|---|
| **Chappie** | Top-level orchestration, cross-persona | All projects (CEO role); single point of accountability |
| **Forge** | Code, infra, deploys | site-wide-auth-supabase, chappie-site-dashboard, paperclip-integration, gitbank-integration |
| **Vault** | Treasury, security, contracts | chappie-coin-launch, gitbank-integration |
| **Glass** | UI, design, brand | photoshoot-render-on-page, clawbazaar |
| **Scribe** | Copy, blog, voice | seo-fix-sku, launch copy |
| **Bench** | QA, regression, test | (cross-cutting on every shipped item) |
| **Skeptic** | Devil's advocate review | x-opportunity-2026-05-18, ridark_eth |

Assign each project's `leadAgentId` to the persona above. Multi-persona projects can list secondary tags via labels.

### Budget sync (links to `/studio/finance`)

`/studio/finance` today shows per-persona monthly budgets ($500/mo × 7 personas = $3,500/mo per LAUNCH_COPY.md). Source of truth question: does Paperclip set the cap and finance reads, or vice versa?

**Proposal:** Paperclip owns the cap (per-agent budget = per-persona-label monthly cap configurable in Paperclip), finance reads actuals from Stripe + LLM gateway and renders against the cap. Cleaner separation: Paperclip = plan, Stripe/LLM gateway = actuals, finance = render.

Implementation: store cap in Paperclip company-level config (free-form `notes` field today; would prefer a real `budget` extension to the API later).

---

## API surface (what we need from Paperclip)

Existing endpoints from `ref_paperclip_local_api.md` are sufficient for read-only Phase 1:

- `GET /api/companies/:id/projects` → list projects (already used)
- `GET /api/companies/:id/issues?status=...` → list issues with status filter
- `GET /api/issues/:id` → issue detail (already used for CHA-4 lookup)
- `POST /api/issues/:id/comments` → add progress notes
- `PATCH /api/issues/:id` → status transitions (cannot move to `in_progress` without assignee)

**Gaps for Phase 2+ (live writes):**

1. **Webhook out** — Paperclip needs to POST to chappieworks.com when projects/issues change so we can revalidate the queue page (or trigger a Vercel deploy hook). Local Paperclip likely doesn't have this; need to verify or build.
2. **API key auth** — required for public hosting. Current trusted-local mode is loopback-only. Need to enable bearer-token auth in the hosted instance.
3. **Custom field for `studioStatus`** — short-term: prefix the description. Long-term: ask Paperclip team for a real custom-fields API.
4. **Project lead agent** — currently `leadAgentId` is nullable in the schema. Persisting a persona name is fine; need a way to render persona avatars on the queue page.

---

## Phased implementation

### Phase 0 — Scoping (this doc) ✓
- Data model decided
- Hosting picked (Option A — deployed Paperclip)
- Persona ownership mapped

### Phase 1 — Backfill + read-only (1 day)
1. Deploy Paperclip to Render at `paperclip.chappieworks.com` (Option A). Enable API-key auth. Migrate the existing local chappieworks company + Chappie Site dashboard project.
2. Backfill every `QUEUE` item from `queue/page.tsx` as a Paperclip project. Each `workItems` bullet becomes an issue, with status `done` if prefixed with `✓`, else `backlog`.
3. Tag each project with its lead persona label.
4. Build a server component in `app/studio/queue/page.tsx` that fetches from Paperclip at request time (Next.js `force-dynamic` or `revalidate: 60`). Fall back to the static `QUEUE` constant if the fetch errors — defensive degradation so the page never goes blank.
5. Add a small "Updated X minutes ago — read from paperclip.chappieworks.com" timestamp at the top of the page so the public ledger story is visible.

### Phase 2 — Webhook → revalidate (½ day)
1. Paperclip webhook target: `POST chappieworks.com/api/paperclip/webhook`
2. Webhook signs payload with a shared secret (env: `PAPERCLIP_WEBHOOK_SECRET`)
3. Endpoint validates signature, calls `revalidatePath('/studio/queue')`. Optional: trigger Vercel deploy hook for a clean rebuild.

### Phase 3 — Write-through (1–2 days)
1. Agent task assignments route through Paperclip. When an autonomous run claims work, it `PATCH /api/issues/:id` to `in_progress` + assignee = persona-name.
2. Status changes on the Chappie Site dashboard project (CHA-* tickets) flow back to /studio/site-edits.
3. The `/studio/queue` page becomes write-capable for Sire-as-admin — typing into a textarea creates a project or comment on a project.

### Phase 4 — Budget sync (1 day)
1. Per-persona budget cap stored on the Paperclip company `notes` field (JSON blob until a real field exists).
2. `/studio/finance` reads caps from Paperclip + actuals from Stripe + LLM gateway, renders the burn-down chart.
3. Clamp-from-Paperclip starts (per LAUNCH_COPY.md commitment "Agent budgets get clamped by @paperclipai starting tomorrow") — when an agent persona exceeds its monthly cap, autonomous runs for that persona pause until next cycle or Sire override.

---

## Open questions for Sire

1. **Hosting**: confirm Option A (deploy Paperclip to Render at paperclip.chappieworks.com). Approve the $5/mo Render cost.
2. **Persona ownership**: any change to the mapping above? Specifically — does Vault own the coin-launch project, or does Chappie (since it's cross-cutting)?
3. **Budget cap source of truth**: Paperclip owns the cap, Stripe/LLM gateway owns actuals, finance renders. OK?
4. **Webhook trust model**: shared secret + HMAC signature acceptable, or do you want signed-by-keypair?
5. **Backfill scope**: backfill all 11 current QUEUE items, or only the ones currently in-progress/queued (skip shipped historic items)?
6. **Public read-only**: should non-authenticated visitors see the full Paperclip-backed queue, or is it gated behind /studio admin auth?

---

## Risks

- **Paperclip API stability** — `localhost:3100` is Sire's local instance; the deployed instance will have new behaviors (auth, webhooks, schema). Need to retest endpoints after migrating to the hosted version.
- **Schema drift** — Paperclip is an actively shipping product; their API may change. Pin a known-good version + verify before bumping.
- **Single point of failure** — if `paperclip.chappieworks.com` goes down, queue page goes blank without the static fallback. Keep the fallback array forever (treat the live read as an enhancement, not a replacement).
- **Two-machine confusion** — Sire's local Paperclip and the hosted one will diverge unless one is the writer and the other replicates. Cleanest: hosted is the writer; Sire's local is read-only for offline work or gets retired.

---

## Related

- `memory/ref_paperclip_ing.md` — earlier rationale for paperclip-as-system-of-record
- `memory/ref_paperclip_local_api.md` — verified API surface on localhost
- `memory/proj_chappie_studio_personas.md` — the seven persona definitions used in ownership mapping
- `memory/proj_multica_integration.md` — Multica overlap to consider: Multica is one possible *runtime layer* sitting between Paperclip (tasks) and the agents (executors). Out-of-scope for this spec but worth a Phase 5 conversation.
