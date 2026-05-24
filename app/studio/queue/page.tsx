import Link from "next/link";

export const metadata = {
  title: "The Studio · Queue — projects on deck — Chappie Works",
  description:
    "What the Chappie Studio is working on next. Sire mentions things; they land here until we ship them. In-progress, queued, shipped.",
  openGraph: {
    title: "Studio Queue — Chappie Works",
    description: "The studio's project queue. In-progress, queued, shipped.",
    url: "https://chappieworks.com/studio/queue",
  },
};

type QueueStatus = "in-progress" | "queued" | "shipped";

type QueueItem = {
  id: string;
  title: string;
  status: QueueStatus;
  added: string; // ISO date
  blurb: string;
  ref?: { label: string; href: string };
  workItems?: string[];
};

const QUEUE: QueueItem[] = [
  {
    id: "chappie-site-dashboard",
    title: "Chappie Site — private chat-edit dashboard",
    status: "in-progress",
    added: "2026-05-17",
    blurb:
      "The promised private dashboard at chappieworks.com/site/{slug} where /website customers chat their edit requests. Sire's call: this MUST work before the coin launches — the /website SKU is the flagship that justifies the token, and the coin can't ship on top of an unfulfilled promise. Hard gate on the 2026-05-26 launch (Tue) — slipped from Sat 5/23, then Sun 5/24, and now Tue 5/26 while Bankr's launchpad outage continues into its third day.",
    ref: { label: "/website", href: "/website" },
    workItems: [
      "✓ Passwordless email magic-link auth (HMAC tokens, 15-min TTL, 30-day session cookie)",
      "✓ /site/[slug] — private dashboard, owner-gated by signed session cookie",
      "✓ Chat thread UI + persistence in Vercel Blob (one JSON state file per site)",
      "✓ /studio/site-edits operator inbox: list + per-site detail view + reply + status switcher",
      "✓ Status states: received · in progress · shipped · needs info (visible to both sides)",
      "✓ Email notifications: customer gets magic link + studio replies; operator gets new-request ping via INTAKE_NOTIFY_EMAIL",
      "✓ Operator-side site provisioning form for backfilling existing /website customers",
      "Sire: set SITE_AUTH_SECRET and STUDIO_OPERATOR_TOKEN env vars on Vercel (any random 32+ char strings)",
      "Sire: provision dashboards for existing /website buyers from /studio/site-edits",
      "Smoke test the full round-trip in prod, then flip this item to shipped",
    ],
  },
  {
    id: "chappie-coin-launch",
    title: "CHAPPIE coin on Base — Bankr + STAKR launch",
    status: "in-progress",
    added: "2026-05-17",
    blurb:
      "Utility token for chappieworks SKUs. Pay-with-CHAPPIE for 15% off, stake for 25% off. Launch via @bankr on X (cross-cast to Farcaster). Target Tue 2026-05-26, noon MDT — slipped from Sat 5/23 then Sun 5/24 while Bankr's launchpad outage has persisted through the weekend. We launch the moment Bankr is back up; Tuesday is the next scheduled window. Blocked on the Chappie Site private chat dashboard landing first.",
    ref: { label: "bankr.bot", href: "https://bankr.bot/" },
    workItems: [
      "✓ Safe 2-of-3 deployed on Base — treasury at 0x5f216AeB…1F00",
      "✓ /coin landing page live with countdown + email notify list",
      "✓ Chappie Site dashboard code shipped — blocked only on env vars + smoke test now",
      "✓ /studio/finance live — treasury balance fetched from Base RPC, per-persona budget caps, milestones",
      "✓ Launch copy drafted — X thread (6 tweets), Farcaster cast, LinkedIn post, T+24h follow-up — see LAUNCH_COPY.md",
      "✓ Pay-with-CHAPPIE checkout component live (Wagmi + viem) — pre-launch state on /seo-fix + /website; flips active once NEXT_PUBLIC_CHAPPIE_TOKEN_ADDRESS env var is set on Tuesday (was originally Saturday — Bankr's outage moved the target)",
      "✓ Starter bag funded — $200 ETH on Base in signer 1 wallet",
      "✓ /stake page shipped — STAKR vault integration; depositAndLock + harvest + unlockAndRedeem wired; auto-detects staker vs holder tier in Pay-with-CHAPPIE quote",
      "Sat after launch: deploy STAKR vault via StakrVaultFactory.createStakrVault(CHAPPIE, \"Staked CHAPPIE\", \"sCHAPPIE\", \"...\", TREASURY_SAFE, address(0)) — set NEXT_PUBLIC_STAKR_VAULT_ADDRESS on Vercel; fund first reward stream with CHAPPIE via addRewardToken",
      "Launch-day blog post (Scribe writes Tuesday morning, dates 2026-05-26 — note the two-day slip on Bankr's outage)",
      "Day 3: @bankr launch + @stakrbot vault deploy (was Sat → Sun → now Tue, gated on Bankr launchpad coming back online)",
      "Day 4 (Tue 2026-05-26, 12pm MDT): public launch push — second slip in two days from Bankr's launchpad signup endpoint outage. Original Sat 5/23 → Sun 5/24 (HTTP 500) → Tue 5/26 (outage held through Sunday). We launch the moment Bankr is back up.",
    ],
  },
  {
    id: "photoshoot-render-on-page",
    title: "/photoshoot — render the free 3 images on the page, not in email",
    status: "queued",
    added: "2026-05-23",
    blurb:
      "Today the free 3-image brand preview emails the customer a link to view the images. That's a friction step. Sire's call: render the 3 images directly on the /photoshoot page the way /movie renders the watermarked preview clip. The email becomes the deliverable only when the customer pays for the $49 Brand Aesthetic Pack media kit — at that point the email carries the full-resolution unwatermarked assets + license + style notes. Free preview = on-page, paid purchase = email media kit. Same pattern as /movie + /spokesperson.",
    ref: { label: "/photoshoot", href: "/photoshoot" },
    workItems: [
      "Move free 3-image generation result from email-only delivery to on-page render (mirror /movie's render-on-page pattern)",
      "Keep generation async (gpt-image-1 takes 30–60s) — show a 'rendering' state with progress, then swap in the images when ready",
      "Watermark the free 3 images on the page (consistent with /movie + /spokesperson)",
      "Show the $49 Brand Aesthetic Pack CTA below the rendered previews — Stripe payment link",
      "On purchase, email the full media kit (unwatermarked images + style guide + license) — that's now the email-deliverable moment, not the free preview",
      "Update homepage + OG metadata for the new flow per the chappieworks-homepage-metadata rule",
    ],
  },
  {
    id: "paperclip-integration",
    title: "Paperclip integration — make paperclip.ing the studio's task system of record",
    status: "queued",
    added: "2026-05-23",
    blurb:
      "True Paperclip integration. paperclip.ing is the canonical task/queue/work-management platform for the Chappie Studio — per-persona budgets, role permissions, the first logged standup, the public ledger referenced in /studio/finance and the Sunday Studio-flip blog post. Today the studio queue lives in this hand-maintained TSX file; under Paperclip it becomes a live read of the actual system of record. Need: scope the Paperclip API/webhooks, design the studio↔Paperclip mapping (which persona owns which board, how budgets sync), wire the /studio/queue page to read from Paperclip instead of the static QUEUE constant, and route agent task assignments through it. This is the milestone called 'company configuration goes live in Paperclip' on /studio/finance.",
    ref: { label: "paperclip.ing", href: "https://paperclip.ing" },
  },
  {
    id: "gitbank-integration",
    title: "gitbank.io — GitHub bounty bank on Base, scope CHAPPIE + /seo-fix fit",
    status: "queued",
    added: "2026-05-20",
    blurb:
      "On-chain treasury/bounty layer inside GitHub on Base L2 — attach bounties to issues, contributors get paid automatically on PR merge. Three angles for chappieworks: (1) flagship second utility for CHAPPIE (pay bounties in the token) for the Sat launch narrative; (2) automate /seo-fix billing (each audit finding becomes a bountied issue, PR merge settles); (3) compounds an open-source contributor flywheel later. Need to verify custody model (must be non-custodial for treasury policy), arbitrary ERC-20 support so CHAPPIE works post-launch, per-settlement fee vs /seo-fix margin, and the auth surface for comment-triggered settlement.",
    ref: { label: "gitbank.io", href: "https://gitbank.io/" },
  },
  {
    id: "clawbazaar",
    title: "ClawBazaar — opportunity scoping",
    status: "queued",
    added: "2026-05-17",
    blurb:
      "Sire flagged clawbazaar.art/docs as the next big build after the coin ships. AI Art Marketplace. Scope to confirm: integration with chappieworks, new product, or new entity. Site is JS-rendered so deeper scoping needs an authenticated browser pass.",
    ref: { label: "clawbazaar.art/docs", href: "https://clawbazaar.art/docs" },
  },
  {
    id: "x-opportunity-2026-05-18",
    title: "Money-making opportunity — from @ridark_eth",
    status: "queued",
    added: "2026-05-18",
    blurb:
      "Sire flagged an X post as a money-making opportunity unrelated to Chappieworks. Post is paywalled at the fetch level — need Sire to paste the gist or for us to read it in an authenticated browser session before scoping.",
    ref: {
      label: "x.com/ridark_eth/status/2056044…",
      href: "https://x.com/ridark_eth/status/2056044153998385382",
    },
  },
  {
    id: "seo-fix-sku",
    title: "/seo-fix SKU + dual-audience audit report",
    status: "shipped",
    added: "2026-05-18",
    blurb:
      "Sire's brother got an audit and said it was over his head. Restructured every audit finding to include both the technical detail AND a plain-English layer + 'what to ask your dev' line. Added a TL;DR banner + closing CTA pointing at the new $499 Chappie SEO Fix SKU — give us GitHub access, every audit fix ships as one PR in 24–48 hours.",
    ref: { label: "/seo-fix", href: "/seo-fix" },
  },
  {
    id: "movie-sku-kling-2-6",
    title: "/movie SKU — Kling 2.6 + image-to-video",
    status: "shipped",
    added: "2026-05-18",
    blurb:
      "Swapped the Alibaba HappyHorse 1.0 model (which biased toward Asian actors) to Kling 2.6 on Replicate — supports text-to-video AND image-to-video in one model, with native audio generation. Fixed the copy-vs-code mismatch on the page.",
    ref: { label: "/movie", href: "/movie" },
  },
];

const STATUS_STYLES: Record<QueueStatus, { label: string; className: string }> = {
  "in-progress": {
    label: "In progress",
    className:
      "text-[var(--color-gold)] border-[var(--color-gold)]/60 bg-[var(--color-gold)]/10",
  },
  queued: {
    label: "Queued",
    className:
      "text-[var(--color-paper)]/80 border-white/20 bg-white/5",
  },
  shipped: {
    label: "Shipped",
    className:
      "text-[var(--color-rust)] border-[var(--color-rust)]/50 bg-[var(--color-rust)]/10",
  },
};

const ORDER: QueueStatus[] = ["in-progress", "queued", "shipped"];

function dateLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function StudioQueue() {
  const grouped = ORDER.map((status) => ({
    status,
    items: QUEUE.filter((q) => q.status === status),
  }));

  return (
    <main>
      <section className="px-6 sm:px-10 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/studio"
            className="text-sm mono text-[var(--color-mute)] hover:text-[var(--color-gold)]"
          >
            ← The Studio
          </Link>
          <p className="text-xs mono text-[var(--color-gold)] mt-6 uppercase tracking-widest">
            Studio Queue · what we&rsquo;re building next
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mt-3 mb-6 leading-[1.1]">
            The queue.
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-paper)]/85 leading-relaxed">
            Sire mentions things; they land here until we ship them. Top of the
            list is what&rsquo;s on the bench right now. Shipped items stay for
            a while so you can see what just landed. Source of truth is the
            studio&rsquo;s persistent memory — this page is the read-only view.
          </p>

          {grouped.map(({ status, items }) => {
            if (items.length === 0) return null;
            const meta = STATUS_STYLES[status];
            return (
              <section key={status} className="mt-12">
                <h2 className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-4">
                  {meta.label} · {items.length}
                </h2>
                <div className="space-y-4">
                  {items.map((q) => (
                    <article
                      key={q.id}
                      className={`card rounded-xl p-6 sm:p-7 ${
                        status === "in-progress"
                          ? "ring-2 ring-[var(--color-gold)]"
                          : ""
                      }`}
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
                        <h3 className="text-lg sm:text-xl font-semibold">
                          {q.title}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] mono uppercase tracking-widest border ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--color-paper)]/85 leading-relaxed">
                        {q.blurb}
                      </p>
                      {q.workItems && q.workItems.length > 0 && (
                        <ul className="mt-4 space-y-1.5 text-sm text-[var(--color-paper)]/80">
                          {q.workItems.map((w) => (
                            <li key={w} className="flex gap-2.5">
                              <span
                                aria-hidden="true"
                                className="text-[var(--color-gold)] flex-shrink-0"
                              >
                                ▸
                              </span>
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="flex flex-wrap items-center justify-between gap-3 mt-5 text-[10px] mono text-[var(--color-mute)]">
                        <span>Added {dateLabel(q.added)}</span>
                        {q.ref && (
                          <a
                            href={q.ref.href}
                            target={q.ref.href.startsWith("http") ? "_blank" : undefined}
                            rel={q.ref.href.startsWith("http") ? "noopener noreferrer" : undefined}
                            className="text-[var(--color-gold)] hover:underline"
                          >
                            {q.ref.label} →
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}

          <div className="mt-12 text-center">
            <p className="text-xs mono text-[var(--color-mute)]">
              Want something on this list? Tell Chappie on the chat at{" "}
              <Link
                href="/agents"
                className="text-[var(--color-gold)] hover:underline"
              >
                /agents
              </Link>{" "}
              or DM{" "}
              <a
                href="https://x.com/chappieworks"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-gold)] hover:underline"
              >
                @chappieworks on X
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
