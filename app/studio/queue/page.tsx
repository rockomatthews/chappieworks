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
    id: "site-wide-auth-supabase",
    title: "Site-wide auth + /studio hub + wallet connect + super user",
    status: "in-progress",
    added: "2026-05-25",
    blurb:
      "Sire said \"We'll use Supabase. Start with auth.\" Phase 1 is the wholesale swap of the magic-link layer from custom HMAC + Vercel Blob session cookies to Supabase Auth + Resend-branded emails, plus the new public Sign in surface, plus the /studio hub becoming the auth-aware home for logged-in users. Wallet panel + super-user / admin pills live in /studio above the seven personas. Phase 2 (queued) moves site records + chat messages to Postgres with RLS.",
    ref: { label: "/signin", href: "/signin" },
    workItems: [
      "✓ /api/site/auth/{login,confirm,logout} — Supabase admin.generateLink + verifyOtp, custom Resend email (commit ee7c3a7)",
      "✓ /api/auth/{login,callback,logout} — site-wide email magic-link sign in (commit 7fa0946)",
      "✓ /signin page + Header Sign in pill (logged out) / You pill → /studio (logged in)",
      "✓ /studio is now async + reads Supabase session → MeBlock above the org chart (commit 817598c)",
      "✓ /account redirects to /studio — no duplicate hub",
      "✓ Wallet panel in /studio: injected + Coinbase connector, auto-links address to user_metadata, live $CHAPPIE + ETH balance tiles",
      "✓ Super User pill for rob@fastwebwork.com + /website $99 launch-fee bypass (commit 8445ec1)",
      "✓ Admin pill for ADMIN_EMAILS — studio inbox / queue / finance / debates shortcuts",
      "✓ Resend allowlist + Site URL config noted in SUPABASE_SETUP.md",
      "✓ MeBlock visual polish — KPI tile row (Account · Role · Wallet) + responsive card grid matching org-chart aesthetic",
      "X (Twitter) OAuth button is wired but gated on NEXT_PUBLIC_X_AUTH_ENABLED — flip to live after Sire registers app at developer.x.com + pastes keys into Supabase",
      "Farcaster sign-in — Supabase has no native provider, SIWF integration is a multi-day build",
      "Per-user \"Your projects\" listing on /studio — needs Phase 2 (Postgres sites + messages with RLS)",
      "Admin-bypass \"Create a site without intake\" form in /studio admin tools",
    ],
  },
  {
    id: "chappie-site-dashboard",
    title: "Chappie Site — private chat-edit dashboard",
    status: "shipped",
    added: "2026-05-17",
    blurb:
      "Private dashboard at chappieworks.com/site/{slug} where /website customers chat their edit requests. Shipped before the Tue 5/26 coin launch as the hard prerequisite — the /website SKU is the flagship that justifies the token. Auth layer migrated to Supabase 2026-05-25 (see top-of-queue item) which kills the three open audit findings (C-3 consume-once, C-5 enum hint, C-8 timing leak). Records still on Vercel Blob; Postgres move is Phase 2.",
    ref: { label: "/website", href: "/website" },
    workItems: [
      "✓ Passwordless Supabase magic-link auth — admin.generateLink + verifyOtp, Resend-branded email (was HMAC + Blob session cookie; swapped 2026-05-25)",
      "✓ /site/[slug] — private dashboard, gated by Supabase session + email match against site.ownerEmail",
      "✓ Chat thread UI + persistence in Vercel Blob (one JSON state file per site)",
      "✓ /studio/site-edits operator inbox: list + per-site detail view + reply + status switcher",
      "✓ Status states: received · in progress · shipped · needs info (visible to both sides)",
      "✓ Email notifications: customer gets magic link + studio replies; operator gets new-request ping via INTAKE_NOTIFY_EMAIL",
      "✓ Operator-side site provisioning form for backfilling existing /website customers",
      "✓ Welcome email + sign-in flow both mint Supabase magic links (no more 7-day HMAC tokens floating around)",
    ],
  },
  {
    id: "chappie-coin-launch",
    title: "CHAPPIE coin on Base — Clanker direct + STAKR launch",
    status: "shipped",
    added: "2026-05-17",
    blurb:
      "Utility token for chappieworks SKUs — pay with CHAPPIE for 15% off, stake in the STAKR vault for 25% off + a share of swap-fee rewards. Shipped Tue 2026-05-26 after a two-day Bankr-outage slip (Sat 5/23 → Sun 5/24 → Tue 5/26). v1 went out via the @bankr cast template at 12:02 MDT but the cast flow only set minimal metadata (no image, no website, no twitter, description \"Deployed using Bankr\"); Base App / Coinbase Wallet rendered a blank placeholder. Relaunched 2 hours later via Clanker direct deploy with full metadata + fee recipient = Treasury Safe. CHAPPIE v2 lives at 0xC685BE0d…5b07; STAKR vault at 0x1605e25e…0e09 (owner = Treasury Safe). v1 holders not airdropped per Sire's call. Pay-from-Stake router (CHA-5) is the open v1.1 commitment from the launch thread.",
    ref: { label: "basescan ↗", href: "https://basescan.org/address/0xC685BE0d178b91bE72c952f191ebF9dD66665b07" },
    workItems: [
      "✓ Safe 2-of-3 deployed on Base — treasury at 0x5f216AeB…1F00",
      "✓ /coin landing page with countdown + email notify list",
      "✓ Chappie Site private dashboard shipped — Supabase magic-link auth, /studio/site-edits operator inbox",
      "✓ /studio/finance live — treasury balance fetched from Base RPC, per-persona budget caps, milestones",
      "✓ Launch copy drafted in LAUNCH_COPY.md — X thread, Farcaster cast, LinkedIn post, T+24h follow-up",
      "✓ Pay-with-CHAPPIE quote endpoint reads vault lockedShares to auto-detect staker vs holder tier",
      "✓ Starter bag funded — $200 ETH on Base in signer 1 wallet",
      "✓ /stake page wired — depositAndLock + harvest + unlockAndRedeem",
      "✓ Tue 2026-05-26 12:02 MDT — v1 launched via @bankr cast at 0xcDc0B214…7BA3. Bankr cast-template metadata flow shipped with no image, no website, no twitter, generic description; Base App rendered placeholder.",
      "✓ Tue 2026-05-26 14:22 MDT — relaunched via Clanker direct deploy at 0xC685BE0d178b91bE72c952f191ebF9dD66665b07. Static 1% fee tier, WETH pair, rewards routed to Treasury Safe, 0% creator vault, 0 ETH creator buy (Sire bought $200 from personal wallet via Uniswap minute one).",
      "✓ Tue 2026-05-26 14:49 MDT — STAKR vault deployed at 0x1605e25e0c631e5be7e5495f5a083a2131b00e09 via basescan write-contract on the factory, signed from Treasury Safe signer wallet 0x10944…f2b5. Underlying = CHAPPIE v2, owner = Treasury Safe.",
      "✓ Vercel envs NEXT_PUBLIC_CHAPPIE_TOKEN_ADDRESS + NEXT_PUBLIC_STAKR_VAULT_ADDRESS wired to v2 addresses; /coin and /stake render the live contract + vault.",
      "✓ v2 launch tweet posted from @chappieworks (id 2059378493012779008); routes through chappieworks.com/coin because the X 7-day crypto-address filter blocks raw 0x in tweets from new auth keys.",
      "Open: CHA-5 Pay-from-Stake router (Paperclip ticket) — v1.1 commitment publicly promised in the launch thread + /coin + /stake FAQs.",
      "Open: clanker.world metadata edit pass — add website (chappieworks.com) + twitter (@chappieworks) which the Clanker deploy form didn't capture at launch time.",
    ],
  },
  {
    id: "multica-integration",
    title: "Multica — Chappie squad in a project board (Phase 0 done)",
    status: "queued",
    added: "2026-05-25",
    blurb:
      "Phase 0 recon shipped overnight 2026-05-26. Multica is real, active, and lists OpenClaw as a first-class auto-detected runtime — 33k stars, v0.3.8 released yesterday, Apache 2.0-based. Self-host stack is Next.js 16 + Go + Postgres 17 + pgvector; runs on Docker Compose / Render droplet (Vercel can't host the daemon). LLM-judged squad routing maps cleanly to the seven personas. Autopilots use standard 5-field cron + IANA timezone + webhook triggers. GitHub uses a read-only App, not write-scope PATs. Skills are SKILL.md files — OpenClaw path is .agent_context/skills/, not gstack's default. ONE BIG FINDING: license has a SaaS-embed restriction. Internal use is free; selling \"Chappie Works hosts your Multica workspace\" requires written authorization from Multica, Inc. Three compliant paths now scoped: A (customer self-hosts, we sell the squad), B (get commercial license from Multica), C (internal-only, no customer product). Full plan in memory.",
    ref: { label: "multica.ai", href: "https://multica.ai/" },
    workItems: [
      "✓ Phase 0 recon — Multica verified real (33k stars, v0.3.8 2026-05-25, OpenClaw auto-detected from PATH, 11 supported runtimes confirmed)",
      "✓ Self-host stack mapped — Node 20+ / pnpm 10.28+ / Go 1.26+ / Docker / Postgres 17 + pgvector. Install: brew install multica-ai/tap/multica → multica setup --with-server",
      "✓ Squad routing confirmed LLM-judged (leader delegates via @-mention with role-description-aware roster); humans can be squad members alongside agents",
      "✓ Autopilot syntax: standard 5-field cron + IANA timezone + webhook triggers + manual run; create-issue mode (default) or run-only mode",
      "✓ GitHub auth: read-only App on PRs + metadata (NOT a write-scope PAT) — much lighter trust ask than the queue feared",
      "✓ Skills format: SKILL.md + supporting files; OpenClaw path is .agent_context/skills/ (different from gstack's ~/.claude/skills/ — needs 30-min Phase 1 test for bridge approach)",
      "⚠ LICENSE finding — Modified Apache 2.0 with SaaS-embed restriction. Cannot sell Multica-hosting-as-a-service to third parties without written authorization. Internal org use is exempt.",
      "Phase 1 (post-coin-launch): self-host instance on Render droplet, ChappieTeam squad with 7 personas + Sire as human member, 3 real chappieworks issues assigned, verify skill pickup at .agent_context/skills/, time-to-resolution doc",
      "Phase 1B (parallel, $0): email Multica, Inc. about commercial authorization for the managed-squad product — OpenClaw is already on their supported list, we're already in the ecosystem",
      "Phase 2 productize: Path A (customer self-hosts, we sell squad config + onboarding + ongoing work) / Path B (Multica authorizes, we host) / Path C (internal only, no customer product). Default to C unless Phase 1B unlocks B.",
      "Phase 3 differentiate: skills-compound-across-customers angle works fully only under Path B (shared instance); under Path A we curate a Chappie skill pack shipped to every customer (weaker network effect)",
    ],
  },
  {
    id: "photoshoot-render-on-page",
    title: "/photoshoot — render the free 3 images on the page, not in email",
    status: "shipped",
    added: "2026-05-23",
    blurb:
      "The free 3-image brand preview used to email a link. Now it renders directly on /photoshoot the way /movie renders the watermarked preview clip — async with a rendering state, images stream in as they finish, watermark overlay on each preview, $49 Brand Aesthetic Pack CTA below. The email is now the paid-pack deliverable only (unwatermarked media kit + license + style notes). Same pattern as /movie + /spokesperson.",
    ref: { label: "/photoshoot", href: "/photoshoot" },
    workItems: [
      "✓ Moved free 3-image generation from email-only delivery to on-page render (mirrors /movie's render-on-page pattern)",
      "✓ Async render state — pending → generating → ready, images stream in as they finish",
      "✓ Watermark on the free 3 preview images — SVG overlay (CHAPPIE WORKS PREVIEW · -22° rotation, chappieworks.com/photoshoot footer), download removed, right-click suppressed; replaced with \"Buy clean pack to remove watermark\" link",
      "✓ $49 Brand Aesthetic Pack CTA below previews — scrolls to PackBuyForm which kicks straight into Stripe checkout",
      "✓ Pack flow emails the unwatermarked 10-image media kit on purchase — free preview is on-page, paid pack is the email-deliverable",
      "✓ OpenGraph + Twitter metadata with card preview image for link sharing (og-photoshoot.png + summary_large_image card)",
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
