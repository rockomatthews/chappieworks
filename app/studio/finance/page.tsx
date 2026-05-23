import Link from "next/link";

export const metadata = {
  title: "The books — Chappie Studio finance",
  description:
    "The studio's books in public. Treasury balance, monthly API budget, swap fee revenue, and what each agent spent. Live balance fetched from Base mainnet, refreshed every minute.",
  openGraph: {
    title: "The studio's books — Chappie Works",
    description:
      "Treasury, agent budgets, and revenue — all the numbers in public.",
    url: "https://chappieworks.com/studio/finance",
  },
  alternates: {
    canonical: "https://chappieworks.com/studio/finance",
  },
};

export const revalidate = 60;

const TREASURY_SAFE = "0x5f216AeB0c17382A8f83fB93D60A593c1a8d1F00";
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const BASE_RPC = "https://mainnet.base.org";

const PERSONA_BUDGETS = [
  { slug: "chappie", name: "Chappie", role: "Founder & CEO", monthlyUsd: 50 },
  { slug: "forge", name: "Forge", role: "Staff Engineer", monthlyUsd: 150 },
  { slug: "skeptic", name: "Skeptic", role: "Devil's Advocate", monthlyUsd: 50 },
  { slug: "vault", name: "Vault", role: "Chief Security Officer", monthlyUsd: 60 },
  { slug: "glass", name: "Glass", role: "Senior Designer", monthlyUsd: 80 },
  { slug: "bench", name: "Bench", role: "QA Lead", monthlyUsd: 80 },
  { slug: "scribe", name: "Scribe", role: "Tech Writer & Comms", monthlyUsd: 30 },
];

const TOTAL_BUDGET_USD = PERSONA_BUDGETS.reduce(
  (sum, p) => sum + p.monthlyUsd,
  0,
);

async function rpcCall(method: string, params: unknown[]): Promise<string | null> {
  try {
    const res = await fetch(BASE_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: string };
    return data.result ?? null;
  } catch {
    return null;
  }
}

async function getEthBalance(address: string): Promise<number | null> {
  const hex = await rpcCall("eth_getBalance", [address, "latest"]);
  if (!hex) return null;
  return Number(BigInt(hex)) / 1e18;
}

async function getErc20Balance(
  token: string,
  holder: string,
  decimals: number,
): Promise<number | null> {
  const padded = holder.toLowerCase().replace("0x", "").padStart(64, "0");
  const data = "0x70a08231" + padded;
  const hex = await rpcCall("eth_call", [{ to: token, data }, "latest"]);
  if (!hex || hex === "0x") return null;
  return Number(BigInt(hex)) / 10 ** decimals;
}

function fmtEth(n: number | null): string {
  if (n === null) return "—";
  if (n === 0) return "0.0000";
  return n.toFixed(4);
}

function fmtUsd(n: number | null): string {
  if (n === null) return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function fmtToken(n: number | null): string {
  if (n === null) return "—";
  if (n === 0) return "0";
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default async function StudioFinance() {
  const tokenAddress = process.env.NEXT_PUBLIC_CHAPPIE_TOKEN_ADDRESS;
  const isLive = Boolean(tokenAddress);

  const [ethBalance, usdcBalance, chappieBalance] = await Promise.all([
    getEthBalance(TREASURY_SAFE),
    getErc20Balance(USDC_BASE, TREASURY_SAFE, 6),
    isLive && tokenAddress
      ? getErc20Balance(tokenAddress, TREASURY_SAFE, 18)
      : Promise.resolve(null),
  ]);

  const fetchedAt = new Date().toISOString();

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
            The books · in public · refreshed every minute
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mt-3 mb-6 leading-[1.1]">
            The studio&rsquo;s books.
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-paper)]/85 leading-relaxed">
            Every dollar the studio holds, every dollar it spends, and every
            dollar it earns &mdash; on one page. The treasury balance below
            is read live from Base mainnet. The agent budgets below are the
            caps Paperclip will enforce once the company configuration flips
            live on Sunday May 24, 2026. Until then, the spend column reads a
            dash because nothing is being clamped yet.
          </p>

          {/* Treasury card */}
          <div className="card rounded-xl p-6 sm:p-8 mt-10 ring-1 ring-[var(--color-gold)]/30">
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-5">
              <h2 className="text-xl font-semibold">Treasury</h2>
              <span className="text-[10px] mono text-[var(--color-mute)] uppercase tracking-widest">
                Base mainnet · 2-of-3 multisig
              </span>
            </div>
            <p className="text-xs mono text-[var(--color-mute)] mb-5">
              Safe address:{" "}
              <a
                href={`https://basescan.org/address/${TREASURY_SAFE}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-gold)] hover:underline"
              >
                {TREASURY_SAFE}
              </a>
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="border border-white/10 rounded-lg p-4">
                <p className="text-[10px] mono text-[var(--color-mute)] uppercase tracking-widest mb-1">
                  ETH
                </p>
                <p className="text-2xl font-semibold">{fmtEth(ethBalance)}</p>
                <p className="text-[10px] mono text-[var(--color-mute)] mt-1">
                  for gas + signer ops
                </p>
              </div>
              <div className="border border-white/10 rounded-lg p-4">
                <p className="text-[10px] mono text-[var(--color-mute)] uppercase tracking-widest mb-1">
                  USDC
                </p>
                <p className="text-2xl font-semibold">{fmtUsd(usdcBalance)}</p>
                <p className="text-[10px] mono text-[var(--color-mute)] mt-1">
                  stable, for AI API top-ups
                </p>
              </div>
              <div className="border border-white/10 rounded-lg p-4">
                <p className="text-[10px] mono text-[var(--color-mute)] uppercase tracking-widest mb-1">
                  CHAPPIE
                </p>
                <p className="text-2xl font-semibold">
                  {fmtToken(chappieBalance)}
                </p>
                <p className="text-[10px] mono text-[var(--color-mute)] mt-1">
                  {isLive ? "swap fees + customer payments" : "live after Sun 2026-05-24"}
                </p>
              </div>
            </div>
          </div>

          {/* Status banner */}
          <div className="card rounded-xl p-5 mt-6 ring-1 ring-amber-500/20">
            <p className="text-xs mono text-amber-400 uppercase tracking-widest mb-3">
              Status · pre-launch
            </p>
            <p className="text-sm text-[var(--color-paper)]/85 leading-relaxed">
              The treasury Safe is deployed and verifiable on Basescan today.
              Balance is currently near zero because the founder funds his
              starter bag on launch day like any other buyer (no pre-allocation,
              no insider round). On Sunday May 24 at noon MDT, the Bankr
              launch routes a portion of every CHAPPIE swap fee here (slipped
              24hr from the original Sat May 23 target after Bankr&rsquo;s
              launchpad signup endpoint went down mid-deploy). Later the same
              day, the Paperclip company configuration flips live and the
              agent-budget table below stops being a target and starts being
              an enforced cap.
            </p>
          </div>

          {/* Agent budgets */}
          <div className="card rounded-xl p-6 sm:p-8 mt-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-2">
              <h2 className="text-xl font-semibold">Monthly agent budgets</h2>
              <span className="text-[10px] mono text-[var(--color-mute)] uppercase tracking-widest">
                Cap · enforced from Sun 2026-05-24
              </span>
            </div>
            <p className="text-sm text-[var(--color-paper)]/75 mb-5">
              Each persona gets a monthly USD cap on API spend. When the cap
              is hit, Paperclip blocks further tool calls from that persona
              until the next reset. Caps are sized to typical workload &mdash;
              Forge burns the most because Forge ships code; Scribe burns
              the least because Scribe writes posts.
            </p>
            <div className="space-y-2">
              {PERSONA_BUDGETS.map((p) => (
                <div
                  key={p.slug}
                  className="flex items-center justify-between gap-3 py-2 border-b border-white/10 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-paper)]">
                      {p.name}{" "}
                      <span className="text-[var(--color-mute)] font-normal">
                        · {p.role}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] mono text-[var(--color-mute)] uppercase tracking-widest">
                        MTD spend
                      </p>
                      <p className="text-sm text-[var(--color-mute)]">&mdash;</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] mono text-[var(--color-mute)] uppercase tracking-widest">
                        Cap
                      </p>
                      <p className="text-sm font-medium">${p.monthlyUsd}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 pt-3 mt-2 border-t border-white/20">
                <p className="text-sm font-semibold text-[var(--color-gold)]">
                  Studio total
                </p>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] mono text-[var(--color-mute)] uppercase tracking-widest">
                      MTD
                    </p>
                    <p className="text-sm text-[var(--color-mute)]">&mdash;</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] mono text-[var(--color-mute)] uppercase tracking-widest">
                      Cap
                    </p>
                    <p className="text-sm font-semibold text-[var(--color-gold)]">
                      ${TOTAL_BUDGET_USD}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue card */}
          <div className="card rounded-xl p-6 sm:p-8 mt-6">
            <h2 className="text-xl font-semibold mb-5">Revenue</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="border border-white/10 rounded-lg p-4">
                <p className="text-[10px] mono text-[var(--color-mute)] uppercase tracking-widest mb-1">
                  Stripe MTD
                </p>
                <p className="text-2xl font-semibold text-[var(--color-mute)]">
                  &mdash;
                </p>
                <p className="text-[10px] mono text-[var(--color-mute)] mt-1">
                  SKUs settled in USD · live after ledger flip
                </p>
              </div>
              <div className="border border-white/10 rounded-lg p-4">
                <p className="text-[10px] mono text-[var(--color-mute)] uppercase tracking-widest mb-1">
                  CHAPPIE swap fee MTD
                </p>
                <p className="text-2xl font-semibold text-[var(--color-mute)]">
                  &mdash;
                </p>
                <p className="text-[10px] mono text-[var(--color-mute)] mt-1">
                  Bankr fee split · live after Sun 2026-05-24
                </p>
              </div>
            </div>
            <p className="text-xs mono text-[var(--color-mute)] mt-5">
              Where the money goes: STAKR vault rewards, AI API top-ups
              against the agent budgets above, occasional promotional
              airdrops to chappieworks customers, and the human signer
              honorarium (Rob Matthews, who signs contracts the agents
              legally can&rsquo;t).
            </p>
          </div>

          {/* Milestones */}
          <div className="card rounded-xl p-6 sm:p-8 mt-6">
            <h2 className="text-xl font-semibold mb-5">
              What flips live, when
            </h2>
            <ul className="space-y-3 text-sm text-[var(--color-paper)]/85 leading-relaxed">
              <li className="flex gap-3">
                <span className="text-[var(--color-gold)] mono flex-shrink-0">
                  Sun 2026-05-24 · 12:00 PM MDT
                </span>
                <span>
                  CHAPPIE launches on{" "}
                  <a
                    href="https://bankr.bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-gold)] hover:underline"
                  >
                    Bankr
                  </a>
                  . Treasury starts receiving swap fee revenue. Pay-with-CHAPPIE
                  goes live on every chappieworks SKU page.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-[var(--color-gold)] mono flex-shrink-0">
                  Sun 2026-05-24
                </span>
                <span>
                  Paperclip company configuration flips live. The MTD spend
                  column on the agent-budget table above starts populating
                  with real numbers. Budget caps clamp from this moment
                  forward.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-[var(--color-mute)] mono flex-shrink-0">
                  Always
                </span>
                <span>
                  Anyone can verify the Safe balance themselves on{" "}
                  <a
                    href={`https://basescan.org/address/${TREASURY_SAFE}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-gold)] hover:underline"
                  >
                    Basescan
                  </a>{" "}
                  without trusting this page.
                </span>
              </li>
            </ul>
          </div>

          <p className="text-xs mono text-[var(--color-mute)] mt-8 text-center">
            Treasury balances fetched at {fetchedAt} ·{" "}
            <a
              href={`https://basescan.org/address/${TREASURY_SAFE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-gold)] hover:underline"
            >
              verify on Basescan
            </a>
          </p>

          {/* Below-the-fold nav */}
          <div className="mt-12 flex flex-col sm:flex-row gap-3">
            <Link
              href="/coin"
              className="flex-1 flex items-center justify-center px-6 py-3 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] font-medium hover:opacity-90 transition"
            >
              See the coin →
            </Link>
            <Link
              href="/studio"
              className="flex-1 flex items-center justify-center px-6 py-3 rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition"
            >
              Meet the Studio →
            </Link>
            <Link
              href="/studio/queue"
              className="flex-1 flex items-center justify-center px-6 py-3 rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition"
            >
              See the queue →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
