"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { erc20Abi, parseUnits } from "viem";
import { TREASURY_SAFE, getChappieTokenAddress } from "../lib/web3/config";

type Tier = "holder" | "staker";

type Quote = {
  usd: number;
  tier: Tier;
  discountedUsd: number;
  chappieAmount: number;
  pricePerChappieUsd: number;
  live: boolean;
  notice: string;
};

type Props = {
  usd: number;
  sku: string;
  customerEmail?: string;
  className?: string;
};

export function PayWithChappieButton({
  usd,
  sku,
  customerEmail,
  className = "",
}: Props) {
  const tokenAddress = getChappieTokenAddress();
  const isLive = Boolean(tokenAddress);

  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<
    "idle" | "verifying" | "ok" | "error"
  >("idle");
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);

  const { writeContract, data: txHash, isPending: isSending, error: writeError } =
    useWriteContract();
  const { isLoading: isMining, isSuccess: isMined } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const balanceQuery = useReadContract({
    address: tokenAddress ?? undefined,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(tokenAddress && address) },
  });

  useEffect(() => {
    if (!isLive) return;
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams({ usd: String(usd) });
        if (address) params.set("address", address);
        const r = await fetch(`/api/pay-with-chappie/quote?${params}`);
        if (!r.ok) throw new Error(await r.text());
        const data = (await r.json()) as Quote;
        if (!cancelled) setQuote(data);
      } catch (e) {
        if (!cancelled)
          setQuoteError(e instanceof Error ? e.message : "quote failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [usd, address, isLive]);

  useEffect(() => {
    if (!isMined || !txHash || !quote) return;
    setConfirmStatus("verifying");
    setConfirmMessage("Confirming transfer on-chain…");
    (async () => {
      try {
        const r = await fetch("/api/pay-with-chappie/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            txHash,
            sku,
            customerEmail: customerEmail ?? "anonymous@chappieworks.com",
            expectedChappie: quote.chappieAmount,
          }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "confirm failed");
        setConfirmStatus("ok");
        setConfirmMessage(
          `Received ${data.chappieReceived.toFixed(0)} CHAPPIE. The studio will email you within 24 hours.`,
        );
      } catch (e) {
        setConfirmStatus("error");
        setConfirmMessage(e instanceof Error ? e.message : "verify failed");
      }
    })();
  }, [isMined, txHash, quote, sku, customerEmail]);

  if (!isLive) {
    return (
      <Link
        href="/coin"
        className={`inline-flex items-center justify-center px-6 py-3 rounded-md border-2 border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-[var(--color-ink)] transition text-sm font-medium ${className}`}
      >
        Pay with CHAPPIE — live Sat May 23 →
      </Link>
    );
  }

  if (!isConnected) {
    const primary = connectors[0];
    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => primary && connect({ connector: primary })}
          disabled={isConnecting || !primary}
          className="inline-flex items-center justify-center px-6 py-3 rounded-md border-2 border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-[var(--color-ink)] transition text-sm font-medium disabled:opacity-50"
        >
          {isConnecting ? "Connecting…" : "Pay with CHAPPIE — connect wallet"}
        </button>
        {connectors.length > 1 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {connectors.slice(1).map((c) => (
              <button
                key={c.uid}
                type="button"
                onClick={() => connect({ connector: c })}
                className="text-[10px] mono uppercase tracking-widest text-[var(--color-mute)] hover:text-[var(--color-gold)]"
              >
                or {c.name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const balance =
    typeof balanceQuery.data === "bigint"
      ? Number(balanceQuery.data) / 1e18
      : null;

  const needsMore =
    quote && balance !== null && balance < quote.chappieAmount;

  const handlePay = () => {
    if (!quote || !tokenAddress) return;
    const amount = parseUnits(quote.chappieAmount.toString(), 18);
    writeContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "transfer",
      args: [TREASURY_SAFE as `0x${string}`, amount],
    });
  };

  return (
    <div className={`${className} space-y-3`}>
      <div className="card rounded-lg p-4 ring-1 ring-[var(--color-gold)]/30">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest">
            Pay with CHAPPIE
          </p>
          <button
            type="button"
            onClick={() => disconnect()}
            className="text-[10px] mono text-[var(--color-mute)] hover:text-[var(--color-paper)]"
          >
            disconnect
          </button>
        </div>

        {quoteError && (
          <p className="text-xs text-red-400 mono">{quoteError}</p>
        )}

        {quote && (
          <div className="text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[var(--color-mute)]">USD price</span>
              <span>${usd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-mute)]">
                {quote.tier} discount (
                {quote.tier === "staker" ? "25%" : "15%"})
              </span>
              <span>-${(usd - quote.discountedUsd).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
              <span className="text-[var(--color-paper)] font-medium">You pay</span>
              <span className="text-[var(--color-gold)] font-semibold">
                {quote.chappieAmount.toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}{" "}
                CHAPPIE
              </span>
            </div>
            <div className="flex justify-between text-[10px] mono text-[var(--color-mute)]">
              <span>Wallet balance</span>
              <span>
                {balance !== null
                  ? balance.toLocaleString("en-US", { maximumFractionDigits: 0 })
                  : "—"}{" "}
                CHAPPIE
              </span>
            </div>
          </div>
        )}

        {needsMore && (
          <p className="text-xs text-amber-400 mt-3">
            Not enough CHAPPIE in this wallet.{" "}
            <a
              href={`https://app.uniswap.org/swap?chain=base&outputCurrency=${tokenAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Buy more on Uniswap
            </a>
            .
          </p>
        )}

        <button
          type="button"
          onClick={handlePay}
          disabled={!quote || isSending || isMining || Boolean(needsMore) || confirmStatus !== "idle"}
          className="w-full mt-4 inline-flex items-center justify-center px-6 py-3 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] font-medium hover:opacity-90 transition text-sm disabled:opacity-50"
        >
          {isSending && "Confirm in wallet…"}
          {!isSending && isMining && "Mining tx…"}
          {!isSending && !isMining && confirmStatus === "verifying" && "Confirming…"}
          {!isSending && !isMining && confirmStatus === "ok" && "Paid · receipt below"}
          {!isSending &&
            !isMining &&
            confirmStatus === "idle" &&
            (quote ? `Send ${quote.chappieAmount.toLocaleString("en-US", { maximumFractionDigits: 0 })} CHAPPIE` : "Loading quote…")}
          {confirmStatus === "error" && "Try again"}
        </button>

        {writeError && (
          <p className="text-xs text-red-400 mt-2">{writeError.message}</p>
        )}

        {confirmMessage && (
          <p
            className={`text-xs mt-3 ${
              confirmStatus === "ok"
                ? "text-emerald-400"
                : confirmStatus === "error"
                  ? "text-red-400"
                  : "text-[var(--color-mute)]"
            }`}
          >
            {confirmMessage}
          </p>
        )}

        {txHash && (
          <p className="text-[10px] mono mt-2 text-[var(--color-mute)]">
            <a
              href={`https://basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-gold)] hover:underline"
            >
              {txHash.slice(0, 10)}…{txHash.slice(-8)} on Basescan →
            </a>
          </p>
        )}
      </div>

      <p className="text-[10px] mono text-[var(--color-mute)] text-center">
        Treasury:{" "}
        <a
          href={`https://basescan.org/address/${TREASURY_SAFE}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          0x5f216AeB…1F00
        </a>
        {" · "}
        <Link href="/studio/finance" className="hover:underline">
          read the books
        </Link>
      </p>
    </div>
  );
}
