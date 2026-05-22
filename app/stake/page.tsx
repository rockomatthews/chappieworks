import Link from "next/link";
import { CreditedBy } from "../components/CreditedBy";
import { ChatThread } from "../components/ChatThread";
import { StakeUI } from "./StakeUI";

export const metadata = {
  title:
    "Stake CHAPPIE — 25% off chappieworks SKUs + share of reward streams — Chappie Works",
  description:
    "Lock CHAPPIE in the STAKR vault on Base. Unlock the permanent 25% discount tier on every chappieworks SKU. Earn a share of reward streams funded from treasury swap-fee revenue.",
  openGraph: {
    title: "Stake CHAPPIE — 25% off SKUs + reward streams",
    description:
      "Lock CHAPPIE in the STAKR vault on Base for the permanent 25% discount tier and a share of reward streams.",
    url: "https://chappieworks.com/stake",
  },
};

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What does staking CHAPPIE actually do?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Two things. (1) It unlocks the permanent 25% discount tier on every chappieworks SKU — beats the 15% holder discount. (2) It earns you a pro-rata share of every active reward stream the treasury is funding into the vault, distributed linearly over each program's window. There's no lockup period beyond your own choice to keep staking.",
      },
    },
    {
      "@type": "Question",
      name: "Where is the vault?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It's a STAKR Protocol vault on Base mainnet — STAKR is the canonical ERC-4626 multi-reward staking primitive on Base. The factory at 0xc7c167…812b is operated by stakrbot.xyz; we deploy our vault from that factory at launch. The vault is owned by the CHAPPIE Treasury Safe (a 2-of-3 multi-sig at 0x5f216A…1F00), which is the only address that can add or modify reward streams.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a lockup or vesting?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No protocol-level lockup. You can unstake any time and your CHAPPIE returns to your wallet in one transaction. The only 'lock' is that you forfeit the discount tier and stop earning rewards the moment you unstake. Rewards already earned are claimed via harvest before or after unstaking.",
      },
    },
    {
      "@type": "Question",
      name: "How are rewards funded?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Bankr routes a portion of every CHAPPIE swap fee to the treasury Safe. The treasury then funds reward streams by calling addRewardToken or modifyRewardToken on the STAKR vault — typically in CHAPPIE itself (recycling fees back to stakers) and over time in ETH or USDC. The treasury follows STAKR's continuous-streaming pattern: short windows topped up weekly rather than one giant lump.",
      },
    },
    {
      "@type": "Question",
      name: "What happens when I unstake?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Click unstake, confirm in your wallet, and the vault redeems your sCHAPPIE shares back to CHAPPIE in one transaction (unlockAndRedeem). Any pending rewards should be harvested first via the Harvest button so you don't leave them behind.",
      },
    },
    {
      "@type": "Question",
      name: "How does the 25% discount actually apply?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "When you click Pay with CHAPPIE on any chappieworks SKU page, the quote endpoint reads your lockedShares balance from the STAKR vault. Locked > 0 → staker tier (25% off). Locked = 0 but you hold CHAPPIE → holder tier (15% off). No staked balance and no CHAPPIE → USD pricing only via Stripe.",
      },
    },
  ],
};

export default function StakePage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
      <section className="px-6 sm:px-10 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/coin"
            className="text-sm mono text-[var(--color-mute)] hover:text-[var(--color-gold)]"
          >
            ← $CHAPPIE
          </Link>
          <p className="text-xs mono text-[var(--color-gold)] mt-6 uppercase tracking-widest">
            Stake CHAPPIE · STAKR vault on Base · 25% off SKUs + reward streams
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mt-3 mb-6 leading-[1.1]">
            Stake CHAPPIE. Get 25% off everything. Earn a share of the fees.
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-paper)]/85 leading-relaxed">
            Lock CHAPPIE in the STAKR vault on Base. Two things flip on:
            the permanent <strong>25% discount tier</strong> on every
            chappieworks SKU (beats the 15% holder discount), and a pro-rata
            share of every reward stream the treasury funds into the vault.
            No lockup period — unstake any time, one transaction.
          </p>

          <div className="mt-8">
            <StakeUI />
          </div>

          <div className="mt-10">
            <ChatThread
              title="Why staking exists — the team argument"
              messages={[
                {
                  speaker: "Skeptic",
                  text: "Most token staking is theater. Lock for an APR funded by emissions from a treasury you also control, with no real economic source — pure dilution dressed up as yield. Why is CHAPPIE staking different?",
                },
                {
                  speaker: "Chappie",
                  text: "Because the reward source is real. Bankr routes swap-fee revenue from every CHAPPIE trade to the treasury Safe. Those fees are already accruing the moment trading starts. Treasury recycles them back to stakers as a reward stream. No emissions, no dilution — just the swap fees the protocol was going to capture anyway, redirected to people who locked.",
                },
                {
                  speaker: "Chappie",
                  text: "The discount tier is the second leg. If you actually use chappieworks (SEO Fix, Movie, Website, Agents), staking gets you 25% off forever. The cost basis to access that discount is just locking CHAPPIE you'd hold anyway. The honest expected outcome isn't a yield-farm lottery — it's a working flywheel where users who stake also use the product, and product revenue funds the next reward stream.",
                },
              ]}
            />
          </div>

          <div className="card rounded-xl p-6 sm:p-8 mt-6">
            <h2 className="text-lg font-semibold mb-4">
              How staking works under the hood
            </h2>
            <ol className="space-y-3 text-sm text-[var(--color-paper)]/90 list-decimal list-inside">
              <li>
                The vault is an{" "}
                <a
                  href="https://docs.stakrbot.xyz/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-gold)] hover:underline"
                >
                  STAKR Protocol
                </a>{" "}
                ERC-4626 vault on Base mainnet. We deploy it from the canonical
                factory at{" "}
                <a
                  href="https://basescan.org/address/0xc7c16776b2eaf541621b11c38df401fc9d4e812b"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-gold)] hover:underline mono text-xs"
                >
                  0xc7c167…812b
                </a>
                {" "}right after CHAPPIE launches on Bankr.
              </li>
              <li>
                The vault is <strong>owned by the CHAPPIE Treasury Safe</strong>
                {" "}(the same 2-of-3 multi-sig that holds swap-fee revenue).
                Only the Safe can add or modify reward streams — no random
                actor can spam reward tokens or rug the program.
              </li>
              <li>
                You stake by calling <code>depositAndLock(amount, you)</code> —
                CHAPPIE goes into the vault, you get locked sCHAPPIE shares.
                The shares track your pro-rata claim on every active reward
                stream and your eligibility for the discount tier.
              </li>
              <li>
                Rewards accrue linearly across each program&rsquo;s
                {" "}<code>startTime → endTime</code> window. Treasury follows
                STAKR&rsquo;s recommended continuous-streaming pattern: short
                windows topped up weekly via <code>modifyRewardToken</code>{" "}
                rather than one giant lump-sum allocation.
              </li>
              <li>
                Claim with <code>harvest(you)</code> any time — sends all
                pending rewards across every active token to your wallet. Exit
                with <code>unlockAndRedeem(shares, you)</code> — pulls your
                shares out and redeems them back to CHAPPIE.
              </li>
            </ol>
          </div>

          <div className="card rounded-xl p-6 sm:p-8 mt-6">
            <h2 className="text-lg font-semibold mb-4">The two-tier discount</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] mono text-[var(--color-mute)] uppercase tracking-widest">
                  <th className="text-left pb-2">Tier</th>
                  <th className="text-left pb-2">Requirement</th>
                  <th className="text-right pb-2">Discount</th>
                </tr>
              </thead>
              <tbody className="text-[var(--color-paper)]/90">
                <tr className="border-t border-white/10">
                  <td className="py-2.5">Holder</td>
                  <td className="py-2.5">CHAPPIE in your wallet</td>
                  <td className="py-2.5 text-right text-[var(--color-gold)] font-medium">
                    15% off
                  </td>
                </tr>
                <tr className="border-t border-white/10">
                  <td className="py-2.5 font-medium">Staker</td>
                  <td className="py-2.5">CHAPPIE locked in STAKR vault</td>
                  <td className="py-2.5 text-right text-[var(--color-gold)] font-semibold">
                    25% off
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="text-xs mono text-[var(--color-mute)] mt-5">
              Discount applies on every &ldquo;Pay with CHAPPIE&rdquo; checkout
              across <Link href="/website" className="hover:underline text-[var(--color-gold)]">/website</Link>,{" "}
              <Link href="/seo-fix" className="hover:underline text-[var(--color-gold)]">/seo-fix</Link>,{" "}
              <Link href="/movie" className="hover:underline text-[var(--color-gold)]">/movie</Link>,{" "}
              <Link href="/agents" className="hover:underline text-[var(--color-gold)]">/agents</Link>, and every
              future SKU. Tier is read live from your wallet at quote time.
            </p>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/coin"
              className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition text-sm"
            >
              ← $CHAPPIE coin spec
            </Link>
            <a
              href="https://stakrbot.xyz/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition text-sm"
            >
              STAKR Protocol →
            </a>
            <Link
              href="/studio/finance"
              className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition text-sm"
            >
              Treasury books →
            </Link>
          </div>

          <CreditedBy slugs={["chappie", "forge", "skeptic"]} />
        </div>
      </section>
    </main>
  );
}
