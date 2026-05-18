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
    id: "chappie-coin-launch",
    title: "CHAPPIE coin on Base — Bankr + STAKR launch",
    status: "in-progress",
    added: "2026-05-17",
    blurb:
      "Utility token for chappieworks SKUs. Pay-with-CHAPPIE for 15% off, stake for 25% off. Launch via @bankr on X (cross-cast to Farcaster). Target Sat 2026-05-24.",
    ref: { label: "bankr.bot", href: "https://bankr.bot/" },
    workItems: [
      "Sire: deploy 2-of-3 Safe on Base via app.safe.global",
      "Sire: fund signer 1 wallet with $200 of ETH on Base for starter bag",
      "Pay-with-CHAPPIE checkout component on chappieworks (Wagmi + viem)",
      "/coin landing page on chappieworks",
      "Launch copy: X thread + Farcaster cast + LinkedIn + blog",
      "Day 3: @bankr launch + @stakrbot vault deploy",
      "Day 4 (Sat 2026-05-24): public launch push",
    ],
  },
  {
    id: "chappie-site-dashboard",
    title: "Chappie Site — private chat-edit dashboard",
    status: "queued",
    added: "2026-05-17",
    blurb:
      "Build the promised private dashboard at chappieworks.com/site/{slug} where Chappie Site customers chat their edit requests. For the first 3-5 paying clients we handle edits by email; build the dashboard once volume justifies.",
    ref: { label: "/website", href: "/website" },
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
