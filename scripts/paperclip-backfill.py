#!/usr/bin/env python3
"""
One-time backfill: mirror the current static QUEUE in app/studio/queue/page.tsx
into the local Paperclip instance at localhost:3100. After this runs, the
queue page can be refactored to read live from Paperclip and the static array
becomes only a defensive fallback.

Idempotent: skips projects whose urlKey already exists; skips issues whose
title already exists in the target project.

Usage:
  python3 scripts/paperclip-backfill.py [--dry]
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request

API = "http://localhost:3100/api"
COMPANY_ID = "2d9f539d-792e-4b80-8b87-18d630ed69ac"  # chappieworks (issuePrefix CHA)

PERSONA_LEADS = {
    "chappie": "CEO / orchestrator — assigns + routes; last-call accountability",
    "forge": "Code, infra, deploys",
    "vault": "Treasury, contracts, security",
    "glass": "UI, design, brand",
    "scribe": "Copy, blog, voice",
    "bench": "QA, regression, test",
    "skeptic": "Devil's advocate review",
}

# Queue snapshot as of 2026-05-26 22:00 MDT (post-CHAPPIE-v2-launch).
# Mirrors app/studio/queue/page.tsx — kept here as one-time backfill data.
# After this runs, paperclip is the source of truth and the static QUEUE in
# the page becomes a defensive fallback only.
QUEUE = [
    {
        "id": "site-wide-auth-supabase",
        "title": "Site-wide auth + /studio hub + wallet connect + super user",
        "status": "in-progress",
        "lead": "forge",
        "blurb": "Phase 1 swap of magic-link layer from custom HMAC + Vercel Blob session cookies to Supabase Auth + Resend-branded emails, plus the new public Sign in surface, plus the /studio hub becoming the auth-aware home for logged-in users.",
        "items": [
            "✓ /api/site/auth/{login,confirm,logout} — Supabase admin.generateLink + verifyOtp, custom Resend email",
            "✓ /api/auth/{login,callback,logout} — site-wide email magic-link sign in",
            "✓ /signin page + Header Sign in pill / You pill → /studio",
            "✓ /studio reads Supabase session → MeBlock above the org chart",
            "✓ /account redirects to /studio — no duplicate hub",
            "✓ Wallet panel in /studio: injected + Coinbase connector, live CHAPPIE + ETH balance tiles",
            "✓ Super User pill for rob@fastwebwork.com + /website $99 launch-fee bypass",
            "✓ Admin pill for ADMIN_EMAILS — studio inbox / queue / finance / debates shortcuts",
            "X (Twitter) OAuth — wired but gated on NEXT_PUBLIC_X_AUTH_ENABLED",
            "Farcaster sign-in — Supabase has no native provider, SIWF is a multi-day build",
            "Per-user 'Your projects' on /studio — needs Phase 2 (Postgres + RLS)",
            "Admin-bypass 'Create a site without intake' form in /studio admin tools",
        ],
    },
    {
        "id": "chappie-site-dashboard",  # EXISTING — keep but don't recreate issues
        "title": "Chappie Site — private chat-edit dashboard",
        "status": "shipped",
        "lead": "forge",
        "skip_issues": True,  # already has CHA-1..5 tickets
        "blurb": "Private dashboard at chappieworks.com/site/{slug} where /website customers chat their edit requests. Shipped before the Tue 5/26 coin launch.",
        "items": [],
    },
    {
        "id": "chappie-coin-launch",
        "title": "CHAPPIE coin on Base — Clanker direct + STAKR launch",
        "status": "shipped",
        "lead": "vault",
        "blurb": "Utility token for chappieworks SKUs. Pay with CHAPPIE for 15% off, stake for 25% + share of swap-fee rewards. Shipped Tue 2026-05-26; v1 via Bankr cast had broken metadata, relaunched 2h later via Clanker direct.",
        "items": [
            "✓ Safe 2-of-3 deployed on Base — treasury at 0x5f216AeB…1F00",
            "✓ /coin landing page with countdown + email notify list",
            "✓ /studio/finance live — treasury balance fetched from Base RPC",
            "✓ Launch copy drafted in LAUNCH_COPY.md",
            "✓ Pay-with-CHAPPIE quote endpoint reads vault lockedShares to detect staker tier",
            "✓ Starter bag funded — $200 ETH on Base in signer 1 wallet",
            "✓ /stake page wired — depositAndLock + harvest + unlockAndRedeem",
            "✓ Tue 2026-05-26 12:02 MDT — v1 launched via @bankr cast at 0xcDc0B214…7BA3; metadata broken",
            "✓ Tue 2026-05-26 14:22 MDT — relaunched via Clanker direct at 0xC685BE0d…5b07",
            "✓ Tue 2026-05-26 14:49 MDT — STAKR vault at 0x1605e25e…0e09 (Treasury Safe-owned)",
            "✓ Vercel envs CHAPPIE_TOKEN + STAKR_VAULT wired to v2; /coin + /stake render live",
            "✓ v2 launch tweet from @chappieworks (id 2059378493012779008)",
            "Open: clanker.world metadata edit pass — add website + twitter",
        ],
    },
    {
        "id": "multica-integration",
        "title": "Multica — Chappie squad in a project board",
        "status": "queued",
        "lead": "forge",
        "blurb": "Phase 0 recon shipped overnight 2026-05-26. Multica is real (33k stars), OpenClaw auto-detected. LICENSE forbids SaaS reselling without authorization — three compliant paths scoped.",
        "items": [
            "✓ Phase 0 recon — Multica verified real (33k stars, OpenClaw auto-detected, 11 runtimes)",
            "✓ Self-host stack mapped — Node 20+ / pnpm 10.28+ / Go 1.26+ / Docker / Postgres 17 + pgvector",
            "✓ Squad routing confirmed LLM-judged",
            "✓ Autopilot syntax: 5-field cron + IANA timezone + webhook triggers",
            "✓ GitHub auth: read-only App (not write-scope PAT)",
            "✓ Skills format: SKILL.md; OpenClaw path is .agent_context/skills/",
            "⚠ LICENSE — Modified Apache 2.0 with SaaS-embed restriction",
            "Phase 1 (post-coin-launch): self-host on Render droplet, ChappieTeam squad, 3 issues",
            "Phase 1B (parallel): email Multica, Inc. about commercial authorization",
            "Phase 2 productize: Path A / B / C decision",
            "Phase 3 differentiate: shared-skills network effect (Path B only)",
        ],
    },
    {
        "id": "photoshoot-render-on-page",
        "title": "/photoshoot — render the free 3 images on the page, not in email",
        "status": "shipped",
        "lead": "glass",
        "blurb": "Free 3-image brand preview renders inline on /photoshoot like /movie's watermarked preview clip. Email is the paid-pack deliverable only.",
        "items": [
            "✓ Moved free 3-image generation from email-only to on-page render",
            "✓ Async render state — pending → generating → ready",
            "✓ Watermark on free 3 previews (SVG overlay)",
            "✓ $49 Brand Aesthetic Pack CTA below previews",
            "✓ Pack flow emails unwatermarked 10-image media kit on purchase",
            "✓ OG + Twitter card metadata (og-photoshoot.png)",
        ],
    },
    {
        "id": "paperclip-integration",
        "title": "Paperclip integration — make paperclip.ing the studio's system of record",
        "status": "in-progress",
        "lead": "forge",
        "blurb": "Wire chappieworks.com/studio/queue to read live from a deployed paperclip.ing instance instead of a hand-maintained TSX array. Phase 1 in flight 2026-05-26.",
        "items": [
            "✓ Phase 0 — spec doc PAPERCLIP_INTEGRATION_SPEC.md (commit c195f78)",
            "✓ Sire locked decisions: deploy to Render at paperclip.chappieworks.com; HMAC webhook; backfill all 11 items; public read",
            "Phase 1 — backfill 11 queue items into local Paperclip (script in scripts/paperclip-backfill.py)",
            "Phase 1 — app/lib/paperclip.ts read library (fetch + types + status mapping)",
            "Phase 1 — refactor /studio/queue/page.tsx to dynamic fetch w/ static fallback",
            "Phase 1 — Sire deploys Paperclip to Render at paperclip.chappieworks.com ($5/mo)",
            "Phase 2 — /api/paperclip/webhook for HMAC-signed revalidate",
            "Phase 3 — write-through: agent task assignments route via Paperclip",
            "Phase 4 — budget sync: Paperclip caps + Stripe/LLM actuals → /studio/finance",
        ],
    },
    {
        "id": "gitbank-integration",
        "title": "gitbank.io — GitHub bounty bank on Base, scope CHAPPIE + /seo-fix fit",
        "status": "queued",
        "lead": "vault",
        "blurb": "On-chain treasury/bounty layer inside GitHub on Base — attach bounties to issues, contributors paid on PR merge. Three angles: flagship second utility for CHAPPIE, automate /seo-fix billing, contributor flywheel.",
        "items": [
            "Verify custody model — must be non-custodial for treasury policy",
            "Verify arbitrary ERC-20 support so CHAPPIE works post-launch",
            "Per-settlement fee vs /seo-fix margin analysis",
            "Auth surface for comment-triggered settlement",
        ],
    },
    {
        "id": "clawbazaar",
        "title": "ClawBazaar — opportunity scoping",
        "status": "queued",
        "lead": "glass",
        "blurb": "Sire flagged clawbazaar.art/docs as the next big build after the coin ships. AI Art Marketplace. Scope to confirm integration vs new product vs new entity.",
        "items": [
            "Authenticated browser pass on clawbazaar.art/docs (JS-rendered, blocked from fetch)",
            "Scope: integration, new product, or new entity?",
        ],
    },
    {
        "id": "x-opportunity-2026-05-18",
        "title": "Money-making opportunity — from @ridark_eth",
        "status": "queued",
        "lead": "skeptic",
        "blurb": "Sire flagged X post as money-making opportunity unrelated to Chappieworks. Paywalled at fetch level — need Sire's paste or authed browser pass.",
        "items": [
            "Get the gist (paywalled — Sire pastes or we do authed browser pass)",
            "Scope: relevance, effort, return",
        ],
    },
    {
        "id": "seo-fix-sku",
        "title": "/seo-fix SKU + dual-audience audit report",
        "status": "shipped",
        "lead": "scribe",
        "blurb": "Sire's brother got an audit and said it was over his head. Restructured every audit finding to include technical detail + plain-English layer + 'what to ask your dev' line.",
        "items": [
            "✓ Dual-audience finding format (technical + plain-English + ask-your-dev)",
            "✓ TL;DR banner + closing CTA pointing at $499 Chappie SEO Fix SKU",
            "✓ Every audit fix shipped as one PR in 24–48 hours",
        ],
    },
    {
        "id": "movie-sku-kling-2-6",
        "title": "/movie SKU — Kling 2.6 + image-to-video",
        "status": "shipped",
        "lead": "glass",
        "blurb": "Swapped HappyHorse 1.0 (Asian-actor bias) to Kling 2.6 — text-to-video + image-to-video in one model with native audio.",
        "items": [
            "✓ Swapped to Kling 2.6 on Replicate",
            "✓ Native audio generation",
            "✓ Fixed copy-vs-code mismatch on the page",
        ],
    },
]


def http(method: str, path: str, body=None):
    url = f"{API}{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, method=method, data=data,
                                  headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        msg = e.read().decode()
        print(f"  HTTP {e.code} on {method} {path}: {msg[:200]}", file=sys.stderr)
        return None


def slugify(s: str) -> str:
    out = []
    for ch in s.lower():
        if ch.isalnum():
            out.append(ch)
        elif ch in " -_":
            out.append("-")
    res = "".join(out)
    while "--" in res:
        res = res.replace("--", "-")
    return res.strip("-")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true", help="print actions, don't write")
    args = ap.parse_args()

    existing_projects = http("GET", f"/companies/{COMPANY_ID}/projects") or []
    by_key = {p.get("urlKey"): p for p in existing_projects}

    existing_issues = http("GET", f"/companies/{COMPANY_ID}/issues?status=open,in_progress,backlog,done") or []
    issues_by_proj = {}
    for i in existing_issues:
        issues_by_proj.setdefault(i.get("projectId"), set()).add(i.get("title"))

    created = 0
    skipped = 0
    issue_created = 0
    issue_skipped = 0

    for item in QUEUE:
        key = item["id"]
        existing = by_key.get(key)
        if existing:
            print(f"[skip-project] {key} already exists ({existing['id'][:8]})")
            project_id = existing["id"]
            skipped += 1
        else:
            print(f"[create-project] {key} — {item['title']}")
            if args.dry:
                project_id = "DRY_" + key
            else:
                resp = http("POST", f"/companies/{COMPANY_ID}/projects",
                            {"name": item["title"], "description": item["blurb"]})
                if not resp:
                    print(f"  failed; skipping this project's issues")
                    continue
                project_id = resp["id"]
                created += 1

        if item.get("skip_issues"):
            print(f"  [skip-issues] {key} (has existing CHA-* tickets)")
            continue

        existing_titles = issues_by_proj.get(project_id, set())
        for raw in item["items"]:
            title = raw
            status = "backlog"
            if title.startswith("✓"):
                title = title[1:].strip()
                status = "done"
            elif title.startswith("⚠"):
                title = title[1:].strip()
                status = "blocked"

            if title in existing_titles:
                print(f"  [skip-issue] {title[:60]}")
                issue_skipped += 1
                continue

            print(f"  [create-issue] [{status}] {title[:60]}")
            if args.dry:
                continue
            resp = http("POST", f"/companies/{COMPANY_ID}/issues", {
                "projectId": project_id,
                "title": title,
                "description": f"Backfilled from /studio/queue work-item bullet ({item['id']}, lead: {item['lead']}).",
                "priority": "medium",
            })
            if not resp:
                continue
            issue_created += 1
            if status != "backlog":
                http("PATCH", f"/issues/{resp['id']}", {"status": status})

    print("\n=== summary ===")
    print(f"projects created: {created}, skipped: {skipped}")
    print(f"issues created: {issue_created}, skipped: {issue_skipped}")


if __name__ == "__main__":
    main()
