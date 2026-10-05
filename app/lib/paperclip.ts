// Paperclip read library — fetches the studio queue from a deployed paperclip.ing instance
// and shapes it into the QueueItem array the /studio/queue page renders.
//
// Production: reads PAPERCLIP_URL + PAPERCLIP_API_KEY (server-side env, never exposed).
// Defensive: every fetch wrapped in try/catch; the page falls back to its static QUEUE
// constant if Paperclip is unreachable. Treat the live read as enhancement, not requirement.

export type QueueStatus = "in-progress" | "queued" | "shipped";

export type QueueItem = {
  id: string;
  title: string;
  status: QueueStatus;
  added: string;
  blurb: string;
  ref?: { label: string; href: string };
  workItems?: string[];
  lead?: string;
};

type PaperclipProject = {
  id: string;
  name: string;
  description: string | null;
  status: "backlog" | "planned" | "in_progress" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
  urlKey: string;
};

type PaperclipIssue = {
  id: string;
  projectId: string;
  identifier: string;
  title: string;
  status: "backlog" | "todo" | "in_progress" | "in_review" | "done" | "blocked" | "cancelled";
  priority: "critical" | "high" | "medium" | "low" | null;
  createdAt: string;
};

const COMPANY_ID = "2d9f539d-792e-4b80-8b87-18d630ed69ac";

function projectStatusToStudio(s: PaperclipProject["status"]): QueueStatus | null {
  switch (s) {
    case "in_progress": return "in-progress";
    case "completed":   return "shipped";
    case "backlog":
    case "planned":     return "queued";
    case "cancelled":   return null; // hide
  }
}

function issueToWorkItem(i: PaperclipIssue): string {
  if (i.status === "done")    return `✓ ${i.title}`;
  if (i.status === "blocked") return `⚠ ${i.title}`;
  return i.title;
}

// Description prefix on every backfilled project: [queue:<id>][lead:<persona>]\n\n<blurb>
// Recovers the stable queue-id (since Paperclip auto-generates urlKeys with hash suffixes)
// and the lead persona without needing a custom-fields API.
function parseDescription(desc: string | null): { queueId: string | null; lead: string | null; blurb: string } {
  if (!desc) return { queueId: null, lead: null, blurb: "" };
  const m = desc.match(/^\[queue:([^\]]+)\]\[lead:([^\]]+)\]\s*\n*([\s\S]*)$/);
  if (!m) return { queueId: null, lead: null, blurb: desc.trim() };
  return { queueId: m[1], lead: m[2], blurb: m[3].trim() };
}

// Paperclip production auth is better-auth (not a static X-API-Key). The exact
// scheme an external reader uses is env-driven so prod can be matched without a
// code change: PAPERCLIP_API_KEY is the token; PAPERCLIP_AUTH_HEADER overrides
// the header name (default "Authorization"); PAPERCLIP_AUTH_SCHEME overrides the
// prefix (default "Bearer", set empty to send the raw token). Loopback/local
// trusted mode needs no key at all.
function authHeaders(): Record<string, string> {
  const key = process.env.PAPERCLIP_API_KEY;
  if (!key) return {};
  const header = process.env.PAPERCLIP_AUTH_HEADER || "Authorization";
  const scheme = process.env.PAPERCLIP_AUTH_SCHEME ?? "Bearer";
  return { [header]: scheme ? `${scheme} ${key}` : key };
}

async function pcFetch<T>(path: string): Promise<T> {
  const base = process.env.PAPERCLIP_URL;
  if (!base) throw new Error("PAPERCLIP_URL not set");
  const res = await fetch(`${base}${path}`, {
    headers: authHeaders(),
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`paperclip ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

// Fetch the studio queue as QueueItem[] (the same shape the page already renders).
// Returns null if Paperclip is unreachable so the caller can fall back to static.
export async function fetchStudioQueue(): Promise<QueueItem[] | null> {
  try {
    const [projects, issues] = await Promise.all([
      pcFetch<PaperclipProject[]>(`/api/companies/${COMPANY_ID}/projects`),
      pcFetch<PaperclipIssue[]>(`/api/companies/${COMPANY_ID}/issues?status=open,in_progress,backlog,done,blocked`),
    ]);

    const issuesByProject = new Map<string, PaperclipIssue[]>();
    for (const issue of issues) {
      const arr = issuesByProject.get(issue.projectId) ?? [];
      arr.push(issue);
      issuesByProject.set(issue.projectId, arr);
    }

    const items: QueueItem[] = [];
    for (const p of projects) {
      const studioStatus = projectStatusToStudio(p.status);
      if (!studioStatus) continue;
      const { queueId, lead, blurb } = parseDescription(p.description);
      const projIssues = (issuesByProject.get(p.id) ?? [])
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      items.push({
        id: queueId ?? p.urlKey,
        title: p.name,
        status: studioStatus,
        added: p.createdAt.slice(0, 10),
        blurb,
        lead: lead ?? undefined,
        workItems: projIssues.map(issueToWorkItem),
      });
    }
    return items;
  } catch (err) {
    console.warn("[paperclip] fetchStudioQueue failed:", (err as Error).message);
    return null;
  }
}

export const PAPERCLIP_PUBLIC_URL = process.env.NEXT_PUBLIC_PAPERCLIP_URL ?? "https://paperclip.ing";
