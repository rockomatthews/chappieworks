"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  useAccount,
  useBalance,
  useConnect,
  useDisconnect,
  useReadContract,
} from "wagmi";
import { erc20Abi } from "viem";
import { getChappieTokenAddress } from "../lib/web3/config";

type Props = {
  linkedAddress: string | null;
};

function short(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletPanel({ linkedAddress }: Props) {
  const tokenAddress = getChappieTokenAddress();
  const tokenLive = Boolean(tokenAddress);

  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  const [linked, setLinked] = useState<string | null>(linkedAddress);
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  // ETH balance
  const ethBalance = useBalance({
    address: address ?? undefined,
    query: { enabled: Boolean(address) },
  });

  // CHAPPIE balance
  const chappieBalance = useReadContract({
    address: tokenAddress ?? undefined,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(tokenAddress && address) },
  });

  useEffect(() => {
    if (!address) return;
    if (linked && linked.toLowerCase() === address.toLowerCase()) return;
    // Auto-link on first connect.
    setLinking(true);
    setLinkError(null);
    fetch("/api/auth/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    })
      .then(async (r) => {
        const data = (await r.json()) as { ok: boolean; address?: string; error?: string };
        if (data.ok && data.address) {
          setLinked(data.address);
        } else if (data.error) {
          setLinkError(data.error);
        }
      })
      .catch(() => setLinkError("Network error linking wallet."))
      .finally(() => setLinking(false));
  }, [address, linked]);

  async function unlink() {
    setLinking(true);
    setLinkError(null);
    try {
      const r = await fetch("/api/auth/wallet", { method: "DELETE" });
      const data = (await r.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        setLinked(null);
        disconnect();
      } else {
        setLinkError(data.error ?? "Unlink failed.");
      }
    } catch {
      setLinkError("Network error.");
    } finally {
      setLinking(false);
    }
  }

  if (!isConnected) {
    return (
      <div className="card rounded-xl p-6 sm:p-8 mb-6">
        <h2 className="text-lg font-semibold mb-2">Crypto wallet</h2>
        <p className="text-sm text-[var(--color-paper)]/70 leading-relaxed mb-5">
          Connect your wallet to see your CHAPPIE balance, pay for products in
          $CHAPPIE, and stake for tier discounts.
        </p>
        {linked ? (
          <p className="text-xs mono text-[var(--color-mute)] mb-4">
            Previously linked:{" "}
            <span className="text-[var(--color-paper)]/80">{short(linked)}</span>
            {" — "}reconnect to view balance.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {connectors.map((c) => (
            <button
              key={c.uid}
              type="button"
              onClick={() => connect({ connector: c })}
              disabled={isConnecting}
              className="rounded-md border border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-black px-4 py-2 text-sm transition disabled:opacity-50"
            >
              {isConnecting ? "Connecting…" : `Connect ${c.name}`}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const ethFmt = ethBalance.data
    ? Number(ethBalance.data.value) / 1e18
    : null;
  const chappieFmt =
    typeof chappieBalance.data === "bigint"
      ? Number(chappieBalance.data) / 1e18
      : null;

  return (
    <div className="card rounded-xl p-6 sm:p-8 mb-6">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
        <div>
          <h2 className="text-lg font-semibold">Crypto wallet</h2>
          <p className="text-xs mono text-[var(--color-mute)] mt-1">
            {address ? short(address) : "—"} · Base mainnet
          </p>
        </div>
        <button
          type="button"
          onClick={unlink}
          disabled={linking}
          className="text-xs mono text-[var(--color-mute)] hover:text-[var(--color-rust)] underline disabled:opacity-50"
        >
          {linking ? "Working…" : "Disconnect + unlink"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-md border border-white/10 px-4 py-3">
          <div className="text-[10px] mono uppercase tracking-widest text-[var(--color-mute)] mb-1">
            $CHAPPIE
          </div>
          <div className="text-xl font-semibold">
            {tokenLive
              ? chappieFmt === null
                ? "…"
                : chappieFmt.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })
              : "—"}
          </div>
          {!tokenLive ? (
            <Link
              href="/coin"
              className="block text-[10px] mono text-[var(--color-gold)] mt-1 hover:underline"
            >
              Launches Tue May 26 · noon MDT →
            </Link>
          ) : null}
        </div>
        <div className="rounded-md border border-white/10 px-4 py-3">
          <div className="text-[10px] mono uppercase tracking-widest text-[var(--color-mute)] mb-1">
            ETH (Base)
          </div>
          <div className="text-xl font-semibold">
            {ethFmt === null
              ? "…"
              : ethFmt.toLocaleString(undefined, {
                  maximumFractionDigits: 4,
                })}
          </div>
        </div>
      </div>

      {linkError ? (
        <p className="text-sm text-[var(--color-rust)] bg-[var(--color-rust)]/10 border border-[var(--color-rust)]/30 rounded-md px-4 py-3 mb-3">
          {linkError}
        </p>
      ) : null}

      {tokenLive ? (
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/stake"
            className="rounded-md border border-[var(--color-gold)]/40 px-3 py-2 text-[var(--color-gold)] hover:bg-[var(--color-gold)]/10"
          >
            Stake for 25% off →
          </Link>
          <Link
            href="/coin"
            className="rounded-md border border-white/15 px-3 py-2 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]"
          >
            About $CHAPPIE
          </Link>
        </div>
      ) : null}
    </div>
  );
}
