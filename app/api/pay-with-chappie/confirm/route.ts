import { NextResponse } from "next/server";
import { createPublicClient, http, decodeEventLog, parseAbiItem } from "viem";
import { base } from "viem/chains";

export const runtime = "nodejs";
export const maxDuration = 30;

const TREASURY_SAFE = "0x5f216AeB0c17382A8f83fB93D60A593c1a8d1F00";
const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

const publicClient = createPublicClient({
  chain: base,
  transport: http("https://mainnet.base.org"),
});

type Body = {
  txHash?: string;
  sku?: string;
  customerEmail?: string;
  expectedChappie?: number;
};

export async function POST(req: Request) {
  const tokenAddress = process.env.NEXT_PUBLIC_CHAPPIE_TOKEN_ADDRESS;
  if (!tokenAddress) {
    return NextResponse.json(
      {
        error:
          "Token not deployed. Pay-with-CHAPPIE confirmation is offline until Sun May 24 launch.",
      },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }

  const { txHash, sku, customerEmail, expectedChappie } = body;
  if (
    !txHash ||
    !txHash.startsWith("0x") ||
    txHash.length !== 66 ||
    !sku ||
    !customerEmail ||
    !expectedChappie
  ) {
    return NextResponse.json(
      { error: "txHash, sku, customerEmail, expectedChappie all required" },
      { status: 400 },
    );
  }

  let receipt;
  try {
    receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    });
  } catch {
    return NextResponse.json(
      { error: "transaction not found yet — retry in ~15 seconds" },
      { status: 404 },
    );
  }

  if (receipt.status !== "success") {
    return NextResponse.json(
      { error: "transaction reverted on-chain", txHash },
      { status: 400 },
    );
  }

  const transfers = receipt.logs.filter(
    (log) => log.address.toLowerCase() === tokenAddress.toLowerCase(),
  );

  let matched: { from: string; to: string; value: bigint } | null = null;
  for (const log of transfers) {
    try {
      const decoded = decodeEventLog({
        abi: [TRANSFER_EVENT],
        data: log.data,
        topics: log.topics,
      });
      const args = decoded.args as {
        from: string;
        to: string;
        value: bigint;
      };
      if (args.to.toLowerCase() === TREASURY_SAFE.toLowerCase()) {
        matched = args;
        break;
      }
    } catch {
      continue;
    }
  }

  if (!matched) {
    return NextResponse.json(
      { error: "no CHAPPIE transfer to treasury in this tx" },
      { status: 400 },
    );
  }

  const sentChappie = Number(matched.value) / 1e18;
  if (sentChappie < expectedChappie * 0.99) {
    return NextResponse.json(
      {
        error: "amount sent is less than quoted",
        expected: expectedChappie,
        received: sentChappie,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    txHash,
    sku,
    customerEmail,
    chappieReceived: sentChappie,
    from: matched.from,
    blockNumber: receipt.blockNumber.toString(),
    fulfillment: "queued",
    notice:
      "Fulfillment integration with SKU pipelines (audit, website, agents, etc.) ships post-launch. Confirmation is logged; the studio reaches out via email within 24 hours.",
  });
}
