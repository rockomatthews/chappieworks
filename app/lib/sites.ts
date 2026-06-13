import { list, put } from "@vercel/blob";

export type EditStatus = "received" | "in_progress" | "shipped" | "needs_info";

// Edit requests included with the $99 launch before per-request charging kicks in.
export const FREE_EDITS = 5;
export const EDIT_PRICE_CENTS = 2500; // $25 per request after the free 5

export const EDIT_STATUS_LABELS: Record<EditStatus, string> = {
  received: "Received",
  in_progress: "In progress",
  shipped: "Shipped",
  needs_info: "Needs info",
};

export type SiteMessage = {
  id: string;
  at: string;
  from: "customer" | "studio" | "system";
  body: string;
  statusChange?: EditStatus;
};

export type SiteRecord = {
  slug: string;
  ownerEmail: string;
  ownerName: string;
  businessName: string;
  brief?: string;
  liveUrl?: string;
  status: EditStatus;
  createdAt: string;
  updatedAt: string;
  messages: SiteMessage[];
  githubRepo?: string;       // e.g. "Chappieworks-sites/acme-a1b2c3"
  vercelProjectId?: string;  // Vercel project id for auto-deploys
  vercelUrl?: string;        // e.g. "acme-a1b2c3.vercel.app"
  // Payment + edit-budget state.
  paid?: boolean;            // $99 launch paid → build starts
  paidAt?: string;
  editsUsed?: number;        // customer edit requests submitted
  editsPaid?: number;        // extra edits paid for at $25 each (beyond the free 5)
};

const STATE_KEY = (slug: string) => `sites/${slug}/state.json`;
const INDEX_KEY = "sites/_index.json";

type SiteIndex = {
  updatedAt: string;
  slugs: { slug: string; businessName: string; updatedAt: string; status: EditStatus }[];
};

export function newSlug(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function newMessageId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function readSite(slug: string): Promise<SiteRecord | null> {
  const key = STATE_KEY(slug);
  // Public store; list is eventually consistent so retry, and cache-bust the
  // CDN read so a just-written record isn't served stale.
  for (let attempt = 0; attempt < 4; attempt++) {
    const { blobs } = await list({ prefix: key });
    const blob = blobs.find((b) => b.pathname === key);
    if (blob) {
      const res = await fetch(`${blob.url}?v=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) return null;
      return (await res.json()) as SiteRecord;
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, 500));
  }
  return null;
}

export async function writeSite(site: SiteRecord): Promise<void> {
  const updated: SiteRecord = { ...site, updatedAt: new Date().toISOString() };
  await put(STATE_KEY(site.slug), JSON.stringify(updated, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  await touchIndex(updated);
}

export async function appendMessage(
  slug: string,
  message: Omit<SiteMessage, "id" | "at">,
): Promise<SiteRecord | null> {
  const site = await readSite(slug);
  if (!site) return null;
  const full: SiteMessage = {
    id: newMessageId(),
    at: new Date().toISOString(),
    ...message,
  };
  const next: SiteRecord = {
    ...site,
    status: message.statusChange ?? site.status,
    messages: [...site.messages, full],
  };
  await writeSite(next);
  return next;
}

export async function createSite(input: {
  ownerEmail: string;
  ownerName: string;
  businessName: string;
  brief?: string;
  liveUrl?: string;
}): Promise<SiteRecord> {
  const slug = newSlug();
  const now = new Date().toISOString();
  const site: SiteRecord = {
    slug,
    ownerEmail: normalizeEmail(input.ownerEmail),
    ownerName: input.ownerName.trim(),
    businessName: input.businessName.trim(),
    brief: input.brief?.trim() || undefined,
    liveUrl: input.liveUrl?.trim() || undefined,
    status: "received",
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: newMessageId(),
        at: now,
        from: "studio",
        body: `Welcome${input.ownerName ? `, ${input.ownerName.split(" ")[0]}` : ""}. Your brief is in — this is your private build thread. Once the $99 launch is paid, Chappie starts building your full site and your first draft lands right here, usually within 48 hours. After the draft, your first 5 edit requests are free ($25 each after that). Hang tight — we'll post every update here.`,
      },
    ],
  };
  await writeSite(site);
  return site;
}

export async function listSites(): Promise<SiteIndex> {
  const { blobs } = await list({ prefix: INDEX_KEY });
  const blob = blobs.find((b) => b.pathname === INDEX_KEY);
  if (!blob) return { updatedAt: new Date().toISOString(), slugs: [] };
  const res = await fetch(`${blob.url}?v=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) return { updatedAt: new Date().toISOString(), slugs: [] };
  return (await res.json()) as SiteIndex;
}

async function touchIndex(site: SiteRecord): Promise<void> {
  const idx = await listSites();
  const entry = {
    slug: site.slug,
    businessName: site.businessName,
    updatedAt: site.updatedAt,
    status: site.status,
  };
  const next: SiteIndex = {
    updatedAt: new Date().toISOString(),
    slugs: [entry, ...idx.slugs.filter((s) => s.slug !== site.slug)],
  };
  await put(INDEX_KEY, JSON.stringify(next, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}
