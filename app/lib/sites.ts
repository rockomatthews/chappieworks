import { put, list } from "@vercel/blob";

export type EditStatus = "received" | "in_progress" | "shipped" | "needs_info";

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
};

const STATE_KEY = (slug: string) => `sites/${slug}/state.json`;
const INDEX_KEY = "sites/_index.json";

type SiteIndex = {
  updatedAt: string;
  slugs: { slug: string; businessName: string; ownerEmail: string; updatedAt: string; status: EditStatus }[];
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
  const { blobs } = await list({ prefix: STATE_KEY(slug) });
  const blob = blobs.find((b) => b.pathname === STATE_KEY(slug));
  if (!blob) return null;
  const res = await fetch(blob.url, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as SiteRecord;
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
        body: `Welcome${input.ownerName ? `, ${input.ownerName.split(" ")[0]}` : ""}. Your private edit thread is live. Type any change you want — new copy, swapped colors, a fresh page — and the studio will ship it within 24 hours. We'll post back here when it lands.`,
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
  const res = await fetch(blob.url, { cache: "no-store" });
  if (!res.ok) return { updatedAt: new Date().toISOString(), slugs: [] };
  return (await res.json()) as SiteIndex;
}

async function touchIndex(site: SiteRecord): Promise<void> {
  const idx = await listSites();
  const entry = {
    slug: site.slug,
    businessName: site.businessName,
    ownerEmail: site.ownerEmail,
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
