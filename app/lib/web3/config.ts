import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { coinbaseWallet, injected } from "wagmi/connectors";

export const TREASURY_SAFE = "0x5f216AeB0c17382A8f83fB93D60A593c1a8d1F00";
export const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

// STAKR protocol on Base — https://docs.stakrbot.xyz
export const STAKR_FACTORY = "0xc7c16776b2eaf541621b11c38df401fc9d4e812b" as const;
export const STAKR_TOKEN = "0xd1a7387d3ded8cb611a202fc1a9c9c74c23f2ba3" as const;

export function getChappieTokenAddress(): `0x${string}` | null {
  const a = process.env.NEXT_PUBLIC_CHAPPIE_TOKEN_ADDRESS;
  return a && a.startsWith("0x") && a.length === 42 ? (a as `0x${string}`) : null;
}

export function getStakrVaultAddress(): `0x${string}` | null {
  const a = process.env.NEXT_PUBLIC_STAKR_VAULT_ADDRESS;
  return a && a.startsWith("0x") && a.length === 42 ? (a as `0x${string}`) : null;
}

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    injected({ shimDisconnect: true }),
    coinbaseWallet({ appName: "Chappie Works", preference: "all" }),
  ],
  transports: {
    [base.id]: http("https://mainnet.base.org"),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
