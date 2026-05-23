"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { erc20Abi, formatUnits, parseUnits } from "viem";
import {
  getChappieTokenAddress,
  getStakrVaultAddress,
} from "../lib/web3/config";

// Minimal StakrVault ABI — only the functions /stake actually calls.
// Reference: https://stakrbot.xyz/vault-api/SKILL.md
const STAKR_VAULT_ABI = [
  {
    type: "function",
    name: "depositAndLock",
    stateMutability: "nonpayable",
    inputs: [
      { name: "assets", type: "uint256" },
      { name: "_user", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "unlockAndRedeem",
    stateMutability: "nonpayable",
    inputs: [
      { name: "shares", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "harvest",
    stateMutability: "nonpayable",
    inputs: [{ name: "_user", type: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "lockedShares",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "rewardsCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "convertToAssets",
    stateMutability: "view",
    inputs: [{ name: "shares", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

type Mode = "stake" | "unstake";

export function StakeUI() {
  const tokenAddress = getChappieTokenAddress();
  const vaultAddress = getStakrVaultAddress();
  const live = Boolean(tokenAddress && vaultAddress);

  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  const [mode, setMode] = useState<Mode>("stake");
  const [amount, setAmount] = useState("");
  const [needsApprove, setNeedsApprove] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const balanceQuery = useReadContract({
    address: tokenAddress ?? undefined,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(tokenAddress && address) },
  });

  const allowanceQuery = useReadContract({
    address: tokenAddress ?? undefined,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && vaultAddress ? [address, vaultAddress] : undefined,
    query: { enabled: Boolean(tokenAddress && vaultAddress && address) },
  });

  const lockedQuery = useReadContract({
    address: vaultAddress ?? undefined,
    abi: STAKR_VAULT_ABI,
    functionName: "lockedShares",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(vaultAddress && address) },
  });

  const lockedAssetsQuery = useReadContract({
    address: vaultAddress ?? undefined,
    abi: STAKR_VAULT_ABI,
    functionName: "convertToAssets",
    args:
      lockedQuery.data && typeof lockedQuery.data === "bigint"
        ? [lockedQuery.data]
        : undefined,
    query: {
      enabled: Boolean(
        vaultAddress &&
          lockedQuery.data &&
          typeof lockedQuery.data === "bigint" &&
          lockedQuery.data > 0n,
      ),
    },
  });

  const rewardsCountQuery = useReadContract({
    address: vaultAddress ?? undefined,
    abi: STAKR_VAULT_ABI,
    functionName: "rewardsCount",
    query: { enabled: Boolean(vaultAddress) },
  });

  const { writeContract, data: txHash, isPending: isSending, error: writeError } =
    useWriteContract();
  const { isLoading: isMining, isSuccess: isMined } =
    useWaitForTransactionReceipt({ hash: txHash });

  const balance =
    typeof balanceQuery.data === "bigint"
      ? Number(formatUnits(balanceQuery.data, 18))
      : null;
  const locked =
    typeof lockedQuery.data === "bigint"
      ? Number(formatUnits(lockedQuery.data, 18))
      : null;
  const lockedAssets =
    typeof lockedAssetsQuery.data === "bigint"
      ? Number(formatUnits(lockedAssetsQuery.data, 18))
      : null;
  const activeRewards =
    typeof rewardsCountQuery.data === "bigint"
      ? Number(rewardsCountQuery.data)
      : null;

  const parsedAmount = useMemo(() => {
    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0)
      return null;
    try {
      return parseUnits(amount, 18);
    } catch {
      return null;
    }
  }, [amount]);

  useEffect(() => {
    if (mode !== "stake") {
      setNeedsApprove(false);
      return;
    }
    if (!parsedAmount || typeof allowanceQuery.data !== "bigint") {
      setNeedsApprove(false);
      return;
    }
    setNeedsApprove(allowanceQuery.data < parsedAmount);
  }, [mode, parsedAmount, allowanceQuery.data]);

  useEffect(() => {
    if (!isMined) return;
    setStatus("Confirmed.");
    // Re-pull balances after a confirmed write.
    balanceQuery.refetch();
    allowanceQuery.refetch();
    lockedQuery.refetch();
    lockedAssetsQuery.refetch();
    setAmount("");
  }, [isMined, balanceQuery, allowanceQuery, lockedQuery, lockedAssetsQuery]);

  if (!live) {
    return (
      <div className="card rounded-xl p-6 sm:p-8 ring-2 ring-[var(--color-gold)]">
        <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-3 text-center">
          Staking vault deploys at launch
        </p>
        <p className="text-sm text-[var(--color-paper)]/85 leading-relaxed text-center">
          The STAKR vault deploys right after CHAPPIE launches on Sun May 24,
          2026 at 12:00 PM MDT. Once the contract address is set, this page
          will flip live and you&rsquo;ll be able to lock CHAPPIE for the 25%
          discount tier and a share of treasury reward streams.
        </p>
        <p className="text-xs mono text-[var(--color-mute)] text-center mt-4">
          Powered by{" "}
          <a
            href="https://stakrbot.xyz/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-gold)] hover:underline"
          >
            STAKR Protocol
          </a>
          {" · "}
          <Link href="/coin" className="text-[var(--color-gold)] hover:underline">
            read the coin spec →
          </Link>
        </p>
      </div>
    );
  }

  if (!isConnected) {
    const primary = connectors[0];
    return (
      <div className="card rounded-xl p-6 sm:p-8 ring-2 ring-[var(--color-gold)]">
        <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-3 text-center">
          Connect wallet to stake CHAPPIE
        </p>
        <p className="text-sm text-[var(--color-paper)]/85 leading-relaxed text-center mb-5">
          Stake CHAPPIE in the STAKR vault for the 25% discount tier and a
          share of reward streams.
        </p>
        <div className="flex flex-col gap-2 items-center">
          <button
            type="button"
            onClick={() => primary && connect({ connector: primary })}
            disabled={isConnecting || !primary}
            className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] font-medium hover:opacity-90 transition text-sm disabled:opacity-50"
          >
            {isConnecting ? "Connecting…" : "Connect wallet"}
          </button>
          {connectors.length > 1 &&
            connectors.slice(1).map((c) => (
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
      </div>
    );
  }

  const handleApprove = () => {
    if (!parsedAmount || !tokenAddress || !vaultAddress) return;
    setStatus("Approving CHAPPIE for the vault…");
    writeContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "approve",
      args: [vaultAddress, parsedAmount],
    });
  };

  const handleStake = () => {
    if (!parsedAmount || !vaultAddress || !address) return;
    setStatus("Staking…");
    writeContract({
      address: vaultAddress,
      abi: STAKR_VAULT_ABI,
      functionName: "depositAndLock",
      args: [parsedAmount, address],
    });
  };

  const handleUnstake = () => {
    if (!parsedAmount || !vaultAddress || !address) return;
    setStatus("Unstaking…");
    writeContract({
      address: vaultAddress,
      abi: STAKR_VAULT_ABI,
      functionName: "unlockAndRedeem",
      args: [parsedAmount, address],
    });
  };

  const handleHarvest = () => {
    if (!vaultAddress || !address) return;
    setStatus("Harvesting rewards…");
    writeContract({
      address: vaultAddress,
      abi: STAKR_VAULT_ABI,
      functionName: "harvest",
      args: [address],
    });
  };

  const isBusy = isSending || isMining;

  return (
    <div className="space-y-4">
      <div className="card rounded-xl p-6 sm:p-7 ring-2 ring-[var(--color-gold)]">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest">
            Your position
          </p>
          <button
            type="button"
            onClick={() => disconnect()}
            className="text-[10px] mono text-[var(--color-mute)] hover:text-[var(--color-paper)]"
          >
            disconnect
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[10px] mono text-[var(--color-mute)] uppercase tracking-widest mb-1">
              Wallet
            </p>
            <p className="text-base text-[var(--color-paper)] tabular-nums">
              {balance !== null
                ? balance.toLocaleString("en-US", { maximumFractionDigits: 0 })
                : "—"}
            </p>
            <p className="text-[10px] mono text-[var(--color-mute)]">CHAPPIE</p>
          </div>
          <div>
            <p className="text-[10px] mono text-[var(--color-mute)] uppercase tracking-widest mb-1">
              Staked
            </p>
            <p className="text-base text-[var(--color-gold)] tabular-nums">
              {lockedAssets !== null
                ? lockedAssets.toLocaleString("en-US", { maximumFractionDigits: 0 })
                : locked !== null
                  ? locked.toLocaleString("en-US", { maximumFractionDigits: 0 })
                  : "—"}
            </p>
            <p className="text-[10px] mono text-[var(--color-mute)]">
              CHAPPIE locked
            </p>
          </div>
        </div>

        <div className="mt-5 flex border border-white/10 rounded-md overflow-hidden">
          {(["stake", "unstake"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setAmount("");
                setStatus(null);
              }}
              className={`flex-1 py-2 text-xs mono uppercase tracking-widest transition ${
                mode === m
                  ? "bg-[var(--color-gold)] text-[var(--color-ink)]"
                  : "text-[var(--color-mute)] hover:text-[var(--color-paper)]"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <label className="block text-[10px] mono text-[var(--color-mute)] uppercase tracking-widest mb-2">
            Amount (CHAPPIE)
          </label>
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-3 rounded-md bg-[var(--color-raven)] border border-white/10 text-base tabular-nums focus:outline-none focus:border-[var(--color-gold)]"
            />
            <button
              type="button"
              onClick={() => {
                if (mode === "stake" && balance !== null)
                  setAmount(balance.toString());
                if (
                  mode === "unstake" &&
                  lockedAssets !== null &&
                  lockedAssets > 0
                )
                  setAmount(lockedAssets.toString());
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] mono uppercase tracking-widest text-[var(--color-gold)] hover:underline"
            >
              max
            </button>
          </div>
        </div>

        {mode === "stake" && needsApprove && (
          <button
            type="button"
            onClick={handleApprove}
            disabled={!parsedAmount || isBusy}
            className="w-full mt-4 inline-flex items-center justify-center px-6 py-3 rounded-md border-2 border-[var(--color-gold)] text-[var(--color-gold)] font-medium hover:bg-[var(--color-gold)] hover:text-[var(--color-ink)] transition text-sm disabled:opacity-50"
          >
            {isBusy ? "Approving…" : "1. Approve CHAPPIE"}
          </button>
        )}

        {mode === "stake" && !needsApprove && (
          <button
            type="button"
            onClick={handleStake}
            disabled={!parsedAmount || isBusy}
            className="w-full mt-4 inline-flex items-center justify-center px-6 py-3 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] font-medium hover:opacity-90 transition text-sm disabled:opacity-50"
          >
            {isBusy
              ? "Staking…"
              : parsedAmount
                ? "Stake CHAPPIE"
                : "Enter an amount"}
          </button>
        )}

        {mode === "unstake" && (
          <button
            type="button"
            onClick={handleUnstake}
            disabled={!parsedAmount || isBusy || (locked ?? 0) <= 0}
            className="w-full mt-4 inline-flex items-center justify-center px-6 py-3 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] font-medium hover:opacity-90 transition text-sm disabled:opacity-50"
          >
            {isBusy
              ? "Unstaking…"
              : parsedAmount
                ? "Unstake CHAPPIE"
                : "Enter an amount"}
          </button>
        )}

        <button
          type="button"
          onClick={handleHarvest}
          disabled={isBusy || (locked ?? 0) <= 0}
          className="w-full mt-3 inline-flex items-center justify-center px-6 py-3 rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition text-sm disabled:opacity-50"
        >
          {isBusy ? "Working…" : "Harvest pending rewards"}
        </button>

        {writeError && (
          <p className="text-xs text-red-400 mt-3">{writeError.message}</p>
        )}
        {status && !writeError && (
          <p className="text-xs mono text-[var(--color-mute)] mt-3 text-center">
            {status}
          </p>
        )}
        {txHash && (
          <p className="text-[10px] mono mt-2 text-center">
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

      <div className="card rounded-xl p-5 sm:p-6">
        <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2">
          Vault stats
        </p>
        <div className="flex justify-between items-baseline text-sm">
          <span className="text-[var(--color-mute)]">Active reward streams</span>
          <span className="tabular-nums">{activeRewards ?? "—"}</span>
        </div>
        <p className="text-[10px] mono text-[var(--color-mute)] mt-3">
          Vault:{" "}
          <a
            href={`https://basescan.org/address/${vaultAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {vaultAddress?.slice(0, 8)}…{vaultAddress?.slice(-6)} on Basescan →
          </a>
        </p>
      </div>
    </div>
  );
}
