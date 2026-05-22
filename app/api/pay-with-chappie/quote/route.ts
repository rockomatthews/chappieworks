import { NextResponse } from "next/server";

export const runtime = "edge";

const PLACEHOLDER_PRICE_USD_PER_CHAPPIE = 0.0001;
const HOLDER_DISCOUNT = 0.15;
const STAKER_DISCOUNT = 0.25;

function chappieAmount(usd: number, tier: "holder" | "staker"): number {
  const discount = tier === "staker" ? STAKER_DISCOUNT : HOLDER_DISCOUNT;
  const discountedUsd = usd * (1 - discount);
  return discountedUsd / PLACEHOLDER_PRICE_USD_PER_CHAPPIE;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const usdParam = url.searchParams.get("usd");
  const tierParam = url.searchParams.get("tier");
  const tokenAddress = process.env.NEXT_PUBLIC_CHAPPIE_TOKEN_ADDRESS;

  const usd = usdParam ? Number(usdParam) : NaN;
  if (!Number.isFinite(usd) || usd <= 0 || usd > 100_000) {
    return NextResponse.json(
      { error: "usd must be a positive number under 100000" },
      { status: 400 },
    );
  }

  const tier: "holder" | "staker" =
    tierParam === "staker" ? "staker" : "holder";

  const live = Boolean(tokenAddress);

  return NextResponse.json({
    usd,
    tier,
    discountedUsd: usd * (1 - (tier === "staker" ? STAKER_DISCOUNT : HOLDER_DISCOUNT)),
    chappieAmount: chappieAmount(usd, tier),
    pricePerChappieUsd: PLACEHOLDER_PRICE_USD_PER_CHAPPIE,
    treasury: "0x5f216AeB0c17382A8f83fB93D60A593c1a8d1F00",
    tokenAddress: tokenAddress ?? null,
    live,
    quotedAt: new Date().toISOString(),
    source: live ? "placeholder-pre-uniswap" : "pre-launch",
    notice: live
      ? "Price is placeholder. Real Uniswap V4 quote endpoint goes live with the launch."
      : "Token not yet deployed. CHAPPIE lands Sat May 23, 2026 at 12:00 PM MDT.",
  });
}
