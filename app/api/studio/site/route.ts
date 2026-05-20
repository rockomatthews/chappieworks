import { NextResponse } from "next/server";
import { after } from "next/server";
import {
  appendMessage,
  createSite,
  readSite,
  writeSite,
  type EditStatus,
} from "../../../lib/sites";
import { isOperator } from "../../../lib/siteAuth";
import { notifyCustomerOfStudioReply } from "../../../lib/siteNotify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUS: EditStatus[] = ["received", "in_progress", "shipped", "needs_info"];

export async function POST(req: Request) {
  if (!(await isOperator())) {
    return NextResponse.json({ ok: false, error: "Not authorized" }, { status: 401 });
  }
  let parsed: {
    ownerEmail?: string;
    ownerName?: string;
    businessName?: string;
    brief?: string;
    liveUrl?: string;
  };
  try {
    parsed = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 });
  }
  const ownerEmail = (parsed.ownerEmail ?? "").trim();
  const ownerName = (parsed.ownerName ?? "").trim();
  const businessName = (parsed.businessName ?? "").trim();
  if (!ownerEmail || !ownerName || !businessName) {
    return NextResponse.json(
      { ok: false, error: "ownerEmail, ownerName, businessName required" },
      { status: 400 },
    );
  }
  const site = await createSite({
    ownerEmail,
    ownerName,
    businessName,
    brief: parsed.brief,
    liveUrl: parsed.liveUrl,
  });
  return NextResponse.json({ ok: true, slug: site.slug });
}

export async function PATCH(req: Request) {
  if (!(await isOperator())) {
    return NextResponse.json({ ok: false, error: "Not authorized" }, { status: 401 });
  }
  let parsed: {
    slug?: string;
    body?: string;
    status?: EditStatus;
    liveUrl?: string;
    brief?: string;
  };
  try {
    parsed = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 });
  }
  const slug = (parsed.slug ?? "").trim();
  if (!slug) {
    return NextResponse.json({ ok: false, error: "Missing slug" }, { status: 400 });
  }
  const site = await readSite(slug);
  if (!site) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const statusChange =
    parsed.status && VALID_STATUS.includes(parsed.status) && parsed.status !== site.status
      ? parsed.status
      : undefined;
  const body = (parsed.body ?? "").trim();

  let updated = site;

  if (parsed.liveUrl !== undefined || parsed.brief !== undefined) {
    updated = { ...updated };
    if (parsed.liveUrl !== undefined) updated.liveUrl = parsed.liveUrl.trim() || undefined;
    if (parsed.brief !== undefined) updated.brief = parsed.brief.trim() || undefined;
    await writeSite(updated);
  }

  if (body) {
    const next = await appendMessage(slug, {
      from: "studio",
      body,
      statusChange,
    });
    if (next) {
      updated = next;
      after(() =>
        notifyCustomerOfStudioReply({ site: next, body }).catch((err) => {
          console.error("[chappieworks:studio-reply] notify threw", err);
        }),
      );
    }
  } else if (statusChange) {
    const next = await appendMessage(slug, {
      from: "system",
      body: `Status changed to ${statusChange.replace("_", " ")}.`,
      statusChange,
    });
    if (next) updated = next;
  }

  return NextResponse.json({ ok: true, site: updated });
}
