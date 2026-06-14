import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { coinbaseWallet, injected } from "wagmi/connectors";

export const TREASURY_SAFE = "0x5f216AeB0c17382A8f83fB93D60A593c1a8d1F00";
export const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

// STAKR protocol on Base — https://docs.stakrbot.xyz
export const STAKR_FACTORY = "0xc7c16776b2eaf541621b11c38df401fc9d4e812b" as const;
export const STAKR_TOKEN = "0xd1a7387d3ded8cb611a202fc1a9c9c74c23f2ba3" as const;

// CHAPPIE v3 relaunch (Doppler via Bankr, 2026-06-14). These are the live on-chain
// addresses and act as a fallback if the NEXT_PUBLIC envs are ever missing; the env
// still wins so they can be re-pointed without a code change.
export const CHAPPIE_TOKEN_V3 = "0x6FD572f5cd7dD941338554c6C0EDbf4618f79Ba3" as const;
export const STAKR_VAULT_V3 = "0x54449a07b92Ae62Fcb173Cb7C84b081c52D33c13" as const;

function asAddress(a: string | undefined): `0x${string}` | null {
  return a && a.startsWith("0x") && a.length === 42 ? (a as `0x${string}`) : null;
}

export function getChappieTokenAddress(): `0x${string}` | null {
  return asAddress(process.env.NEXT_PUBLIC_CHAPPIE_TOKEN_ADDRESS) ?? CHAPPIE_TOKEN_V3;
}

export function getStakrVaultAddress(): `0x${string}` | null {
  return asAddress(process.env.NEXT_PUBLIC_STAKR_VAULT_ADDRESS) ?? STAKR_VAULT_V3;
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
