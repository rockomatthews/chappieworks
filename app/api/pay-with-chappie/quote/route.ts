import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

export const runtime = "edge";

const PLACEHOLDER_PRICE_USD_PER_CHAPPIE = 0.0001;
const HOLDER_DISCOUNT = 0.15;
const STAKER_DISCOUNT = 0.25;

const LOCKED_SHARES_ABI = [
  {
    type: "function",
    name: "lockedShares",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

function chappieAmount(usd: number, tier: "holder" | "staker"): number {
  const discount = tier === "staker" ? STAKER_DISCOUNT : HOLDER_DISCOUNT;
  const discountedUsd = usd * (1 - discount);
  return discountedUsd / PLACEHOLDER_PRICE_USD_PER_CHAPPIE;
}

function isAddress(s: string | null): s is `0x${string}` {
  return Boolean(s && /^0x[a-fA-F0-9]{40}$/.test(s));
}

async function detectTier(
  vaultAddress: string | undefined,
  userAddress: `0x${string}` | null,
): Promise<"holder" | "staker"> {
  if (!vaultAddress || !userAddress) return "holder";
  if (!/^0x[a-fA-F0-9]{40}$/.test(vaultAddress)) return "holder";
  try {
    const client = createPublicClient({
      chain: base,
      transport: http("https://mainnet.base.org"),
    });
    const locked = await client.readContract({
      address: vaultAddress as `0x${string}`,
      abi: LOCKED_SHARES_ABI,
      functionName: "lockedShares",
      args: [userAddress],
    });
    return locked > 0n ? "staker" : "holder";
  } catch {
    return "holder";
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const usdParam = url.searchParams.get("usd");
  const tierParam = url.searchParams.get("tier");
  const addressParam = url.searchParams.get("address");
  const tokenAddress = process.env.NEXT_PUBLIC_CHAPPIE_TOKEN_ADDRESS;
  const vaultAddress = process.env.NEXT_PUBLIC_STAKR_VAULT_ADDRESS;

  const usd = usdParam ? Number(usdParam) : NaN;
  if (!Number.isFinite(usd) || usd <= 0 || usd > 100_000) {
    return NextResponse.json(
      { error: "usd must be a positive number under 100000" },
      { status: 400 },
    );
  }

  // Tier resolution: if the caller passed an explicit tier, honor it.
  // Otherwise, if we have a wallet address and a deployed vault, read the
  // user's lockedShares from STAKR and infer the tier on-chain. Defaults
  // to holder when we can't tell.
  let tier: "holder" | "staker";
  if (tierParam === "staker" || tierParam === "holder") {
    tier = tierParam;
  } else {
    const user = isAddress(addressParam) ? addressParam : null;
    tier = await detectTier(vaultAddress, user);
  }

  const live = Boolean(tokenAddress);

  return NextResponse.json({
    usd,
    tier,
    discountedUsd: usd * (1 - (tier === "staker" ? STAKER_DISCOUNT : HOLDER_DISCOUNT)),
    chappieAmount: chappieAmount(usd, tier),
    pricePerChappieUsd: PLACEHOLDER_PRICE_USD_PER_CHAPPIE,
    treasury: "0x5f216AeB0c17382A8f83fB93D60A593c1a8d1F00",
    tokenAddress: tokenAddress ?? null,
    vaultAddress: vaultAddress ?? null,
    live,
    quotedAt: new Date().toISOString(),
    source: live ? "placeholder-pre-uniswap" : "pre-launch",
    notice: live
      ? "Price is placeholder. Real Uniswap V4 quote endpoint goes live with the launch."
      : "Token not yet deployed. CHAPPIE lands Sun May 24, 2026 at 12:00 PM MDT.",
  });
}
