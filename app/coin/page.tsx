import Link from "next/link";
import { CreditedBy } from "../components/CreditedBy";
import { IntakeForm, type IntakeField } from "../components/IntakeForm";
import { ChatThread } from "../components/ChatThread";
import { Countdown } from "./Countdown";

// Launch is locked to Sat 2026-05-24 at 12:00 PM MDT (18:00 UTC).
// To pivot this page to post-launch state, set NEXT_PUBLIC_CHAPPIE_TOKEN_ADDRESS
// in Vercel env to the deployed CHAPPIE contract address.
const LAUNCH_ISO = "2026-05-24T18:00:00Z";

export const metadata = {
  title:
    "$CHAPPIE — utility token on Base, launching May 24 — Chappie Works",
  description:
    "CHAPPIE is the utility token for chappieworks AI work. Pay for SEO audits, websites, agent builds, and movies in CHAPPIE for 15% off. Stake for 25% off permanently. Fair launch via Bankr on Base, Saturday May 24, 2026.",
  openGraph: {
    title: "$CHAPPIE — launching May 24 on Base",
    description:
      "Utility token for chappieworks. Pay for AI work in CHAPPIE at a discount. Stake for more. Fair launch via Bankr.",
    url: "https://chappieworks.com/coin",
  },
};

const COIN_FIELDS: IntakeField[] = [
  // Standard name + email come from the form. No extra fields — keeping
  // the launch-notify flow as low-friction as possible.
];

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is CHAPPIE?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "CHAPPIE is the utility token for the Chappie autonomous AI studio. Holders use CHAPPIE to pay for chappieworks AI services — SEO audits, website builds, ad audits, brand visuals, movies, custom agent builds, and more — at a 15% discount to the USD price. Stakers (via the STAKR vault) get a permanent 25% discount tier instead, plus a share of swap fee revenue.",
      },
    },
    {
      "@type": "Question",
      name: "When does CHAPPIE launch?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Saturday, May 24, 2026 at 12:00 PM Mountain Time (18:00 UTC). Launch happens on Bankr (bankr.bot) — Base's leading X-and-Farcaster-native launch protocol. The contract address and buy link will be posted on @chappieworks on X and @rocketship on Farcaster the moment it goes live.",
      },
    },
    {
      "@type": "Question",
      name: "Is this a security?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "CHAPPIE is a utility token — Coinbase's own definition of a utility token is one that 'lets you use a product or service in a specific blockchain system,' which is exactly what CHAPPIE does. Hold CHAPPIE to pay for chappieworks services at a discount. Don't buy CHAPPIE as an investment — the value comes from the discount on services you'd actually use.",
      },
    },
    {
      "@type": "Question",
      name: "What's the tokenomics?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Bankr fair launch: 1,000,000,000 CHAPPIE total supply, no pre-allocation, no founder unlock schedule. Initial price ~$0.0001 (about $100k fully-diluted at launch). All tokens enter circulation via the launch bonding curve, with liquidity locked permanently in Uniswap V4. The founder (Rob Matthews / @chappieworks on X / @rocketship on Farcaster) buys a $200 starter bag like anyone else — no special access, no pre-sale, no insider round.",
      },
    },
    {
      "@type": "Question",
      name: "Where does fee revenue go?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Bankr routes a portion of every CHAPPIE swap to the creator wallet — the CHAPPIE Treasury Safe (a 2-of-3 multi-sig on Base at 0x5f216AeB...1F00). The treasury funds STAKR vault staking rewards, future audits, ongoing chappieworks operations, and occasional promotional airdrops to chappieworks customers.",
      },
    },
    {
      "@type": "Question",
      name: "How do I pay for chappieworks services with CHAPPIE?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Each chappieworks SKU page (/website, /seo-fix, /movie, /agents, /photoshoot) will get a 'Pay with CHAPPIE' button at launch alongside the existing Stripe option. Click it, connect your wallet (Coinbase Wallet, Rainbow, MetaMask), the page reads the current CHAPPIE/USDC price from Uniswap V4, quotes the CHAPPIE amount equal to 85% of the USD price (15% discount), you confirm the transfer in your wallet, and the order proceeds the same as a Stripe payment. Stakers get the 25% discount tier automatically.",
      },
    },
    {
      "@type": "Question",
      name: "What's staking?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Staking is done via STAKR (stakrbot.xyz) — an ERC-4626 staking vault deployed alongside the token launch. Lock your CHAPPIE in the vault and you (a) earn a share of swap fee revenue routed to the vault, and (b) unlock the permanent 25% discount tier on chappieworks services for as long as your stake is active. No lock-up period beyond your own choice to keep funds staked.",
      },
    },
  ],
};

const HARD_NUMBERS = [
  { label: "Total supply", value: "1,000,000,000" },
  { label: "Pre-allocation", value: "0% — fair launch" },
  { label: "Holder discount", value: "15% off SKUs" },
  { label: "Staker discount", value: "25% off SKUs" },
  { label: "Initial FDV", value: "~$100,000" },
  { label: "Network", value: "Base mainnet" },
];

export default async function CoinPage({
  searchParams,
}: {
  searchParams: Promise<{ utm?: string }>;
}) {
  await searchParams;
  const tokenAddress = process.env.NEXT_PUBLIC_CHAPPIE_TOKEN_ADDRESS;
  const isLive = Boolean(tokenAddress);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
      <section className="px-6 sm:px-10 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="text-sm mono text-[var(--color-mute)] hover:text-[var(--color-gold)]"
          >
            ← chappieworks
          </Link>
          <p className="text-xs mono text-[var(--color-gold)] mt-6 uppercase tracking-widest">
            $CHAPPIE · utility token on Base · {isLive ? "live now" : "Sat May 24 · noon MDT"}
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mt-3 mb-6 leading-[1.1]">
            Pay the AI studio. In its own coin. At a discount.
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-paper)]/85 leading-relaxed">
            CHAPPIE is the utility token for chappieworks. Hold it, pay for
            any AI work the studio sells — SEO audits, websites, ad audits,
            brand visuals, movies, custom agents — and get 15% off the USD
            price. Stake it for 25% off, permanently. Fair launch via Bankr on
            Base. No pre-sale, no allocation to insiders. Sire buys a $200
            bag minute one like anyone else.
          </p>

          {!isLive && (
            <div className="card rounded-xl p-6 sm:p-8 mt-8 ring-2 ring-[var(--color-gold)]">
              <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-3 text-center">
                Launch · Sat May 24, 2026 · 12:00 PM MDT (18:00 UTC)
              </p>
              <Countdown targetIso={LAUNCH_ISO} />
              <p className="text-xs mono text-[var(--color-mute)] text-center mt-4">
                Watch <a href="https://x.com/chappieworks" target="_blank" rel="noopener noreferrer" className="text-[var(--color-gold)] hover:underline">@chappieworks on X</a> and{" "}
                <a href="https://warpcast.com/rocketship" target="_blank" rel="noopener noreferrer" className="text-[var(--color-gold)] hover:underline">@rocketship on Farcaster</a> for the launch cast — Bankr deploys CHAPPIE in under 60 seconds from the cast.
              </p>
            </div>
          )}

          {isLive && (
            <div className="card rounded-xl p-6 sm:p-8 mt-8 ring-2 ring-[var(--color-gold)]">
              <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2 text-center">
                CHAPPIE · live on Base
              </p>
              <p className="text-sm text-center text-[var(--color-paper)]/85 mb-4">
                Contract:{" "}
                <a
                  href={`https://basescan.org/address/${tokenAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-gold)] hover:underline mono"
                >
                  {tokenAddress}
                </a>
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href={`https://app.uniswap.org/swap?outputCurrency=${tokenAddress}&chain=base`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] font-medium hover:opacity-90 transition text-sm"
                >
                  Buy on Uniswap →
                </a>
                <a
                  href={`https://dexscreener.com/base/${tokenAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition text-sm"
                >
                  Chart on DexScreener →
                </a>
              </div>
            </div>
          )}

          <div className="card rounded-xl p-6 sm:p-8 mt-6">
            <h2 className="text-lg font-semibold mb-4">The hard numbers</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {HARD_NUMBERS.map((n) => (
                <div
                  key={n.label}
                  className="flex justify-between items-baseline py-2 border-b border-white/10 last:border-0 sm:[&:nth-last-child(2)]:border-0"
                >
                  <span className="text-xs mono text-[var(--color-mute)] uppercase tracking-widest">
                    {n.label}
                  </span>
                  <span className="text-sm text-[var(--color-paper)] font-medium">
                    {n.value}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs mono text-[var(--color-mute)] mt-5">
              Treasury (2-of-3 Safe):{" "}
              <a
                href="https://basescan.org/address/0x5f216AeB0c17382A8f83fB93D60A593c1a8d1F00"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-gold)] hover:underline"
              >
                0x5f216AeB…1F00
              </a>
            </p>
          </div>

          <div className="mt-6">
            <ChatThread
              title="Why launch a coin — The associated team argument"
              messages={[
                {
                  speaker: "Skeptic",
                  text: "Every business in 2026 launching a token says it's a 'utility token.' Most are speculative slop with a thin product narrative bolted on. Why is CHAPPIE different?",
                },
                {
                  speaker: "Chappie",
                  text: "Because the product was built first and is already selling. /website, /seo-fix, /movie, /agents are live on chappieworks.com taking real Stripe payments today. The coin doesn't justify the business — the business justifies the coin. Pay-with-CHAPPIE just gives the existing customer base a reason to hold the token.",
                },
                {
                  speaker: "Chappie",
                  text: "The honest expected outcome isn't a 100x. It's: token trades, a tiny fraction of chappieworks customers prefer paying with CHAPPIE at a discount, the treasury accumulates swap fee revenue, stakers earn a share. Brand benefit is real. Lottery upside exists. We're sizing the launch for the realistic outcome, not the lottery.",
                },
              ]}
            />
          </div>

          <div className="card rounded-xl p-6 sm:p-8 mt-6">
            <h2 className="text-lg font-semibold mb-4">How the discount works</h2>
            <ol className="space-y-3 text-sm text-[var(--color-paper)]/90 list-decimal list-inside">
              <li>
                Pick any chappieworks SKU — Chappie Site, SEO Fix, Movie,
                Agent build, etc.
              </li>
              <li>
                At checkout, click <em>Pay with CHAPPIE</em>. Connect your
                wallet (Coinbase Wallet / Rainbow / MetaMask on Base).
              </li>
              <li>
                The page reads the live CHAPPIE/USDC price from Uniswap V4
                (30-minute TWAP, to defeat flash manipulation) and quotes the
                CHAPPIE amount equal to 85% of the USD price.
              </li>
              <li>
                Confirm the transfer in your wallet. CHAPPIE goes to the
                treasury Safe. The studio fulfills the order the same as if
                you'd paid in dollars via Stripe.
              </li>
              <li>
                Stakers (via the STAKR vault) get the 25% discount tier
                instead — the checkout reads your staked balance and applies
                the deeper discount automatically.
              </li>
            </ol>
            <p className="text-xs mono text-[var(--color-mute)] mt-5">
              Maximum discount caps at 25% regardless of oracle price; if the
              TWAP returns an absurd value the checkout falls back to USD-only.
              This protects both holders and the studio from edge cases.
            </p>
          </div>

          {!isLive && (
            <div id="intake" className="mt-10 scroll-mt-20">
              <h2 className="text-2xl font-semibold tracking-tight mb-2">
                Get notified at launch.
              </h2>
              <p className="text-sm text-[var(--color-mute)] mb-6">
                Drop your email and we&rsquo;ll send the contract address +
                Bankr buy link the moment CHAPPIE goes live on Saturday. No
                spam, just the launch heads-up.
              </p>
              <IntakeForm
                formType="coin"
                fields={COIN_FIELDS}
                submitLabel="Notify me at launch →"
              />
            </div>
          )}

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://bankr.bot/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition text-sm"
            >
              Bankr — the launchpad →
            </a>
            <a
              href="https://stakrbot.xyz/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition text-sm"
            >
              STAKR — the staking vault →
            </a>
            <Link
              href="/studio/queue"
              className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition text-sm"
            >
              The studio queue →
            </Link>
          </div>

          <CreditedBy slugs={["chappie", "forge", "skeptic"]} />
        </div>
      </section>
    </main>
  );
}
