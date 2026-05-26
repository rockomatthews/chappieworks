#!/usr/bin/env python3
"""
Post-backfill cleanup: set the Paperclip project.status enum to the correct
studio status (mapped from QUEUE), and write a structured prefix into the
description so app/lib/paperclip.ts can recover the stable queue-id + lead
persona from any project record.

Paperclip project.status enum: backlog | planned | in_progress | completed | cancelled
Studio status mapping:
  in_progress → in-progress
  completed   → shipped
  backlog     → queued
"""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

API = "http://localhost:3100/api"
COMPANY_ID = "2d9f539d-792e-4b80-8b87-18d630ed69ac"

# Mapping from the existing backfill (matches scripts/paperclip-backfill.py)
# queue-id → (paperclip-project-status, lead persona, blurb)
QUEUE_META = {
    "site-wide-auth-supabase": ("in_progress", "forge",
        "Phase 1 swap of magic-link layer from custom HMAC + Vercel Blob session cookies to Supabase Auth + Resend-branded emails, plus the new public Sign in surface, plus the /studio hub becoming the auth-aware home for logged-in users."),
    "chappie-site-dashboard": ("completed", "forge",
        "Private dashboard at chappieworks.com/site/{slug} where /website customers chat their edit requests. Shipped before the Tue 5/26 coin launch."),
    "chappie-coin-launch": ("completed", "vault",
        "Utility token for chappieworks SKUs. Pay with CHAPPIE for 15% off, stake for 25% + share of swap-fee rewards. Shipped Tue 2026-05-26; v1 via Bankr cast had broken metadata, relaunched 2h later via Clanker direct."),
    "multica-integration": ("backlog", "forge",
        "Phase 0 recon shipped overnight 2026-05-26. Multica is real (33k stars), OpenClaw auto-detected. LICENSE forbids SaaS reselling without authorization — three compliant paths scoped."),
    "photoshoot-render-on-page": ("completed", "glass",
        "Free 3-image brand preview renders inline on /photoshoot like /movie's watermarked preview clip. Email is the paid-pack deliverable only."),
    "paperclip-integration": ("in_progress", "forge",
        "Wire chappieworks.com/studio/queue to read live from a deployed paperclip.ing instance instead of a hand-maintained TSX array. Phase 1 in flight 2026-05-26."),
    "gitbank-integration": ("backlog", "vault",
        "On-chain treasury/bounty layer inside GitHub on Base — attach bounties to issues, contributors paid on PR merge. Three angles: flagship second utility for CHAPPIE, automate /seo-fix billing, contributor flywheel."),
    "clawbazaar": ("backlog", "glass",
        "Sire flagged clawbazaar.art/docs as the next big build after the coin ships. AI Art Marketplace. Scope to confirm integration vs new product vs new entity."),
    "x-opportunity-2026-05-18": ("backlog", "skeptic",
        "Sire flagged X post as money-making opportunity unrelated to Chappieworks. Paywalled at fetch level — need Sire's paste or authed browser pass."),
    "seo-fix-sku": ("completed", "scribe",
        "Sire's brother got an audit and said it was over his head. Restructured every audit finding to include technical detail + plain-English layer + 'what to ask your dev' line."),
    "movie-sku-kling-2-6": ("completed", "glass",
        "Swapped HappyHorse 1.0 (Asian-actor bias) to Kling 2.6 — text-to-video + image-to-video in one model with native audio."),
}

# Match a Paperclip project to a queue-id by inspecting its name.
NAME_TO_QUEUE_ID = {
    "Site-wide auth + /studio hub + wallet connect + super user": "site-wide-auth-supabase",
    "Chappie Site dashboard": "chappie-site-dashboard",
    "Chappie Site — private chat-edit dashboard": "chappie-site-dashboard",
    "CHAPPIE coin on Base — Clanker direct + STAKR launch": "chappie-coin-launch",
    "Multica — Chappie squad in a project board": "multica-integration",
    "/photoshoot — render the free 3 images on the page, not in email": "photoshoot-render-on-page",
    "Paperclip integration — make paperclip.ing the studio's system of record": "paperclip-integration",
    "gitbank.io — GitHub bounty bank on Base, scope CHAPPIE + /seo-fix fit": "gitbank-integration",
    "ClawBazaar — opportunity scoping": "clawbazaar",
    "Money-making opportunity — from @ridark_eth": "x-opportunity-2026-05-18",
    "/seo-fix SKU + dual-audience audit report": "seo-fix-sku",
    "/movie SKU — Kling 2.6 + image-to-video": "movie-sku-kling-2-6",
}


def http(method: str, path: str, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(f"{API}{path}", method=method, data=data,
                                  headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        msg = e.read().decode()[:300]
        print(f"  HTTP {e.code} on {method} {path}: {msg}", file=sys.stderr)
        return None


def main():
    projects = http("GET", f"/companies/{COMPANY_ID}/projects") or []
    print(f"found {len(projects)} projects")

    updated = 0
    for p in projects:
        qid = NAME_TO_QUEUE_ID.get(p["name"])
        if not qid:
            print(f"[unknown] {p['name'][:60]} — skipping (no queue mapping)")
            continue
        meta = QUEUE_META.get(qid)
        if not meta:
            continue
        status, lead, blurb = meta
        # Description prefix carries the stable mapping + lead for the reader.
        desc = f"[queue:{qid}][lead:{lead}]\n\n{blurb}"
        payload = {"status": status, "description": desc}
        print(f"[update] {qid} → status={status} lead={lead}")
        resp = http("PATCH", f"/projects/{p['id']}", payload)
        if resp:
            updated += 1

    print(f"\nupdated {updated} projects")


if __name__ == "__main__":
    main()
