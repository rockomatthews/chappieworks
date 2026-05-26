# CHAPPIE coin launch copy — Tue 2026-05-26, 12:00 PM MDT (18:00 UTC)

> **Slip log:** Original target Sat 2026-05-23 → slipped to Sun 2026-05-24 (Bankr launchpad signup endpoint went down mid-deploy, opaque 500s for ~1hr) → slipped again to Tue 2026-05-26 (Bankr's launchpad outage continued through Sunday). We launch the moment Bankr is back up; Tuesday is the next scheduled window. Every public mention of the launch date should attribute the slip(s) to the Bankr outage explicitly, not hand-wave it.

All copy below is drafted in Chappie voice (per `proj_chappie_voice_profile.md` v2 close-reading rules). Fire in the order listed.

**T-0 sequence (Tuesday noon MDT):**
1. Bankr cast on Farcaster → triggers the contract deploy (~60s)
2. Once contract address is live → grab `0x…` → paste into Vercel env var `NEXT_PUBLIC_CHAPPIE_TOKEN_ADDRESS` → Vercel redeploys (~90s)
3. Tweet the X launch thread (Tweet 1 first, then thread)
4. Cross-post Tweet 1 to Farcaster as a standalone cast (link to chart)
5. LinkedIn post (one piece, long-form B2B framing)
6. Launch-day blog post goes live (already in `blog.ts`, date-gated)

---

## 1. X launch thread (@chappieworks)

**Tweet 1 — the announce. Single image: the Chappie portrait + countdown banner from /coin.**

```
$CHAPPIE is live on Base.

Utility token for chappieworks AI work — pay for SEO audits, websites, agent builds, photoshoots, movies. 15% off in CHAPPIE. 25% off if you stake.

Fair launch via @bankr. No pre-sale. The studio buys a $200 bag minute one like anyone else.

Contract: 0x[FILL_IN_AT_LAUNCH]
```

**Tweet 2 — reply to T1**

```
The whole point: chappieworks is an autonomous AI studio. CHAPPIE is the currency it earns in.

Hold = 15% off any SKU.
Stake = 25% tier + a share of swap-fee rewards streamed back over time. Built for repeat customers.

Not a meme coin. A utility coin tied to actual SKUs you can buy.
```

**Tweet 3 — reply to T2**

```
The studio's books are public:
chappieworks.com/studio/finance

Treasury Safe is a 2-of-3 multisig on Base, balance fetched live from chain. Agent budgets ($500/mo across seven personas) get clamped by @paperclipai starting Tuesday.

You can verify everything yourself.
```

**Tweet 4 — reply to T3**

```
The slate:

/website — $99 full site build
/seo-audit — free, AI-generated PDF in minutes
/seo-fix — $499 every finding shipped as one PR
/photoshoot — free 3-image preview, $49 pack
/movie — $9.99 AI video, 10s tier
/agents — $1,500 custom agent builds

Pay any of them in CHAPPIE at -15%.
```

**Tweet 5 — reply to T4**

```
Why launch on @bankr: fair launch from a cast, no insider round, liquidity locked in Uniswap V4, 1B total supply, ~$100k FDV at launch.

Stake via @stakrbot — ERC-4626 vault, no lockup beyond your choice, share of swap fee revenue.
```

**Tweet 6 — reply to T5 (the close)**

```
Buy: app.uniswap.org/swap?chain=base&outputCurrency=0x[FILL_IN]
Chart: dexscreener.com/base/0x[FILL_IN]
Read: chappieworks.com/coin

Chappie has been working toward this since day one. The studio shipped it. Now we'll see if the work matches the pitch.
```

---

## 2. Farcaster cast (@rocketship)

**Single cast — paired image of Chappie portrait + chart.**

```
$CHAPPIE is live on Base.

Utility coin for chappieworks AI work. Pay for SEO audits, websites, agents, photoshoots, or movies in CHAPPIE for 15% off. Stake for the 25% tier + a share of swap-fee rewards — built for repeat customers.

Fair launch via @bankr. No pre-sale. Founder buys $200 like anyone else.

→ chappieworks.com/coin
→ chappieworks.com/studio/finance (treasury, live on Base)

Contract: 0x[FILL_IN]
Buy on Uniswap: [link]
```

---

## 3. LinkedIn post (Rob Matthews personal + chappieworks page)

**Long-form, B2B framing. No emojis. One paragraph per beat.**

```
We launched a utility token for our AI studio today.

Chappie Works is an autonomous AI studio — seven specialist personas, one bot, building custom AI agents and shipping work for clients. Today we launched CHAPPIE, a Base-native utility coin that lets customers pay for any of our SKUs at a 15% discount when they hold it. Repeat customers stake into the STAKR vault for a 25% tier plus a share of swap-fee revenue, streamed back over time. The math is simple: hold to save, stake to earn + save more.

This is not a fundraise. It is not a pre-sale. There is no insider round. The launch is a fair launch via Bankr — every token enters circulation through a public bonding curve, liquidity is locked permanently in Uniswap V4 on Base, and I (the founder) bought a $200 starter bag minute one like anyone else.

What we are testing: whether a small autonomous business can run on its own currency. The studio's treasury is a 2-of-3 multisig that you can audit on Basescan today. The seven AI agents have monthly API spend caps that Paperclip will enforce starting tomorrow. Every disagreement between personas gets logged in public on chappieworks.com/studio/debates.

If you sell AI services, this might be interesting to study. If you buy AI services, you can pay for ours in CHAPPIE at a discount starting now.

chappieworks.com/coin
```

---

## 4. Launch-day blog post (Scribe)

**Goes live Tuesday morning, dated 2026-05-26.** Already a draft below — committed to `app/lib/blog.ts` post-launch.

Title: "Today CHAPPIE lands."

Author: Chappie (using third-person tic for character — this is one of the rare "Chappie persona" posts per the voice intensity table)

Suggested body outline (write at launch with the actual contract address):
- Today is the day. CHAPPIE is on Base.
- What you can do with it now (pay for SKUs, stake, hold).
- What you can verify (treasury, contract, liquidity lock, the seven-persona budgets).
- What we promise (delivery on the SKUs, public ledger, no insider sells).
- What we don't promise (price, lottery upside, fast pump).
- The studio went to work. The maker bought his $200 bag. Welcome to the books.

---

## 5. T+24h follow-up (Wednesday) — Scribe X post

**One tweet, fired after the Paperclip ledger flips Wednesday afternoon.**

```
The studio's live ledger flipped on this afternoon. MTD spend per persona populating in real time now.

Forge is already over budget for the first day. (Forge ships code; Forge burns the most. This is expected.)

chappieworks.com/studio/finance
```

---

## Pre-fire checklist (Tuesday morning)

- [ ] Confirm Bankr's launchpad is back up before firing (the whole slip story is they were down — verify, don't assume)
- [ ] Wallet funded with $200 ETH on Base (already done from the original Sat target — re-verify balance)
- [ ] Bankr deploy parameters confirmed (1B supply, 0% allocation, name "CHAPPIE", symbol "CHAPPIE")
- [ ] STAKR vault contract ready (post-launch action — vault deploys AFTER contract is live)
- [ ] Tweet image queued (Chappie portrait + countdown banner from /coin)
- [ ] Farcaster cast image queued (paired version)
- [ ] LinkedIn image queued (vertical version)
- [ ] `NEXT_PUBLIC_CHAPPIE_TOKEN_ADDRESS` env var added to Vercel (Sire pastes the address minutes after Bankr deploys it)
- [ ] Blog post for launch day drafted in `app/lib/blog.ts` (Scribe writes Tuesday morning)

## Post-fire monitoring

- Watch the Bankr cast for the contract deploy — typically <60s after the launch cast
- Watch Uniswap pool for first trades
- Watch @chappieworks mentions for support questions
- Watch /studio/finance — treasury balance should start showing non-zero ETH from Bankr fee routing within minutes
- Watch chappieworks.com/coin — the page auto-flips from countdown state to "live now" state once `NEXT_PUBLIC_CHAPPIE_TOKEN_ADDRESS` is set

## Things that absolutely don't happen launch week

- No founder selling in week one (commitment)
- No "promotional airdrops" until the public ledger has been live for 30 days
- No paid promotion to crypto KOLs (the launch story IS the story — the studio shipped the work, the work earns the token)
- No price predictions on any chappieworks-owned channel ever
