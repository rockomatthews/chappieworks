"use server";

import { createHmac } from "crypto";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createSite } from "../lib/sites";
import { mintSiteMagicLink } from "../lib/supabase/magiclink";
import { sendLaunchPayLink, sendWelcomeDashboard } from "../lib/siteNotify";
import { provisionRepo } from "../lib/siteProvision";
import { isBypassEmail } from "../lib/movieEmail";

export type IntakeFormType =
  | "agents"
  | "seo-audit"
  | "ads-audit"
  | "photoshoot"
  | "website"
  | "seo-fix"
  | "coin";

export type IntakeResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

type RawSubmission = {
  formType: IntakeFormType;
  fields: Record<string, string | string[]>;
  honeypot?: string;
  startedAt?: string;
};

const FORM_TITLES: Record<IntakeFormType, string> = {
  agents: "Custom Agent Intake",
  "seo-audit": "Free SEO Audit",
  "ads-audit": "Free Ads Audit",
  photoshoot: "Free Brand Aesthetic Preview",
  website: "Chappie Site — Build Brief",
  "seo-fix": "Chappie SEO Fix — Repo Access Brief",
  coin: "CHAPPIE Coin — Launch Notification Signup",
};

const SUCCESS_COPY: Record<IntakeFormType, string> = {
  agents:
    "Got it. I'll send a one-page spec — scope, tier, price, ship date — within 24 hours.",
  "seo-audit":
    "Got it. Audit is running now. PDF lands in your inbox in minutes from intake@chappieworks.com — check spam just in case.",
  "ads-audit":
    "Got it. Your pre-audit briefing PDF is generating now and lands in your inbox in minutes from intake@chappieworks.com — check spam just in case. We'll ping within 24 to confirm account access, and the full access-based audit + Loom lands within 48 hours.",
  photoshoot:
    "Got it. The studio is generating your 3-image preview — it renders on the page in 2–3 minutes.",
  website:
    "Got it. The studio has your brief. Look for two emails from intake@chappieworks.com — your private edit dashboard link (chat with the studio there), and the $99 Stripe launch link. Both arrive within a few hours; check spam just in case. Pay the $99 and your site goes live within 48 hours.",
  "seo-fix":
    "Got it. The studio has your repo info. Once you've paid the $499 launch fee and granted GitHub access, the fix clock starts — every reasonable item from your audit ships within 24–48 hours as a single PR. Look for instructions in your inbox from intake@chappieworks.com.",
  coin:
    "You're on the list. We'll email you the moment CHAPPIE goes live on Bankr/Base with the exact buy link + contract address. No spam, just the launch heads-up.",
};

// Override success copy for bypass-email users on paid SKUs — no Stripe
// language, since sendLaunchPayLink/equivalents are skipped for them.
const BYPASS_SUCCESS_COPY: Partial<Record<IntakeFormType, string>> = {
  website:
    "Got it. The studio has your brief. Look for one email from intake@chappieworks.com with your private edit dashboard link — no Stripe link, no $99 charge. Site goes live within 48 hours.",
  "seo-fix":
    "Got it. The studio has your repo info. No Stripe link will be sent — the fix clock starts the moment GitHub access is granted, and every reasonable item ships within 24–48 hours as a single PR.",
};

export async function submitIntake(
  prevState: IntakeResult | null,
  formData: FormData,
): Promise<IntakeResult> {
  const formType = formData.get("formType") as IntakeFormType | null;
  if (!formType || !(formType in FORM_TITLES)) {
    return { ok: false, error: "Unknown form type." };
  }

  // Honeypot: bots fill hidden fields. Real users don't.
  const honeypot = (formData.get("website_url_confirm") as string) ?? "";
  if (honeypot.trim().length > 0) {
    // Pretend success — don't tell the bot it failed.
    return { ok: true, message: SUCCESS_COPY[formType] };
  }

  // Min dwell time: bots submit instantly. Real users take >1s.
  const startedAt = Number(formData.get("startedAt") ?? "0");
  if (startedAt && Date.now() - startedAt < 1500) {
    return { ok: true, message: SUCCESS_COPY[formType] };
  }

  // Required: name + email on every form.
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!name || name.length < 2) {
    return { ok: false, error: "Please include your name." };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please include a valid email." };
  }

  // Collect every other field as the structured submission body.
  const fields: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (
      key === "formType" ||
      key === "website_url_confirm" ||
      key === "startedAt" ||
      key === "name" ||
      key === "email"
    ) {
      continue;
    }
    if (typeof value === "string" && value.trim().length > 0) {
      // Group repeated keys (checkboxes) into a comma-list.
      fields[key] = fields[key]
        ? `${fields[key]}, ${value.trim()}`
        : value.trim();
    }
  }

  const submission = {
    formType,
    name,
    email,
    fields,
    receivedAt: new Date().toISOString(),
  };

  // Always log structured to server logs — recoverable even without email.
  console.log("[chappieworks:intake]", JSON.stringify(submission));

  // Best-effort email notification via Resend.
  await tryNotifyByResend(submission);

  // If it's an SEO audit, kick off the autonomous pipeline after the response
  // is sent so the user doesn't wait on PDF generation.
  if (formType === "seo-audit" && submission.fields.url) {
    after(() => triggerSeoAudit(submission));
  }

  // Ads audit: kick off the autonomous pre-audit briefing PDF. The full
  // access-based audit still requires human follow-up — this is the instant
  // lead-magnet deliverable that proves the 250-check rigor.
  if (formType === "ads-audit") {
    after(() => triggerAdsAudit(submission));
  }

  // If it's a website brief, auto-provision the private edit dashboard and
  // email the customer their sign-in link.
  if (formType === "website") {
    after(() => provisionSiteFromBrief(submission));
  }

  revalidatePath(`/${formType === "agents" ? "agents" : formType}`);

  const message = isBypassEmail(email)
    ? (BYPASS_SUCCESS_COPY[formType] ?? SUCCESS_COPY[formType])
    : SUCCESS_COPY[formType];
  return { ok: true, message };
}

async function triggerSeoAudit(submission: {
  formType: IntakeFormType;
  name: string;
  email: string;
  fields: Record<string, string>;
}) {
  const secret = process.env.INTAKE_WEBHOOK_SECRET;
  if (!secret) {
    console.error(
      "[chappieworks:intake] INTAKE_WEBHOOK_SECRET not set — cannot trigger audit",
    );
    return;
  }
  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

  const payload = {
    name: submission.name,
    email: submission.email,
    url: submission.fields.url,
    primary_goal: submission.fields.primary_goal,
    gsc_access: submission.fields.gsc_access,
    target_keywords: submission.fields.target_keywords,
    notes: submission.fields.notes,
  };
  const body = JSON.stringify(payload);
  const sig = createHmac("sha256", secret).update(body).digest("hex");

  try {
    const res = await fetch(`${baseUrl}/api/seo-audit/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-chappie-sig": sig,
      },
      body,
    });
    if (!res.ok) {
      console.error(
        "[chappieworks:intake] audit trigger failed",
        res.status,
        await res.text(),
      );
    } else {
      console.log("[chappieworks:intake] audit triggered for", submission.email);
    }
  } catch (err) {
    console.error("[chappieworks:intake] audit trigger threw", err);
  }
}

async function triggerAdsAudit(submission: {
  formType: IntakeFormType;
  name: string;
  email: string;
  fields: Record<string, string>;
}) {
  const secret = process.env.INTAKE_WEBHOOK_SECRET;
  if (!secret) {
    console.error(
      "[chappieworks:intake] INTAKE_WEBHOOK_SECRET not set — cannot trigger ads briefing",
    );
    return;
  }
  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

  const payload = {
    name: submission.name,
    email: submission.email,
    platforms: submission.fields.platforms,
    access_method: submission.fields.access_method,
    monthly_spend: submission.fields.monthly_spend,
    goals: submission.fields.goals,
    notes: submission.fields.notes,
  };
  const body = JSON.stringify(payload);
  const sig = createHmac("sha256", secret).update(body).digest("hex");

  try {
    const res = await fetch(`${baseUrl}/api/ads-audit/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-chappie-sig": sig,
      },
      body,
    });
    if (!res.ok) {
      console.error(
        "[chappieworks:intake] ads briefing trigger failed",
        res.status,
        await res.text(),
      );
    } else {
      console.log(
        "[chappieworks:intake] ads briefing triggered for",
        submission.email,
      );
    }
  } catch (err) {
    console.error("[chappieworks:intake] ads briefing trigger threw", err);
  }
}

async function tryNotifyByResend(submission: {
  formType: IntakeFormType;
  name: string;
  email: string;
  fields: Record<string, string>;
  receivedAt: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.INTAKE_NOTIFY_EMAIL;
  const from = process.env.INTAKE_FROM_EMAIL ?? "intake@chappieworks.com";

  if (!apiKey || !to) {
    console.log(
      "[chappieworks:intake] RESEND_API_KEY or INTAKE_NOTIFY_EMAIL not set — skipping email; submission logged above",
    );
    return;
  }

  const subject = `[Chappie Works] ${FORM_TITLES[submission.formType]} — ${submission.name}`;
  const lines: string[] = [
    `New intake on chappieworks.com`,
    ``,
    `Form: ${FORM_TITLES[submission.formType]}`,
    `Name: ${submission.name}`,
    `Email: ${submission.email}`,
    `Received: ${submission.receivedAt}`,
    ``,
    `--- Details ---`,
  ];
  for (const [k, v] of Object.entries(submission.fields)) {
    lines.push(`${k}: ${v}`);
  }
  const text = lines.join("\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: submission.email,
        subject,
        text,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(
        "[chappieworks:intake] resend send failed",
        res.status,
        body,
      );
    }
  } catch (err) {
    console.error("[chappieworks:intake] resend send threw", err);
  }
}

async function provisionSiteFromBrief(submission: {
  formType: IntakeFormType;
  name: string;
  email: string;
  fields: Record<string, string>;
}) {
  try {
    const businessName =
      submission.fields.business_name?.trim() || submission.name.trim();
    const briefParts: string[] = [];
    if (submission.fields.business_description) {
      briefParts.push(`What it does: ${submission.fields.business_description}`);
    }
    if (submission.fields.site_type) {
      briefParts.push(`Site type: ${submission.fields.site_type}`);
    }
    if (submission.fields.vibe) {
      briefParts.push(`Aesthetic: ${submission.fields.vibe}`);
    }
    if (submission.fields.reference_url) {
      briefParts.push(`Reference: ${submission.fields.reference_url}`);
    }
    if (submission.fields.domain) {
      briefParts.push(`Domain: ${submission.fields.domain}`);
    }
    if (submission.fields.notes) {
      briefParts.push(`Notes: ${submission.fields.notes}`);
    }

    const site = await createSite({
      ownerEmail: submission.email,
      ownerName: submission.name,
      businessName,
      brief: briefParts.join("\n") || undefined,
    });

    after(() =>
      provisionRepo(site).catch((err) => {
        console.error("[chappieworks:intake] provisionRepo threw", site.slug, err);
      }),
    );

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://chappieworks.com";
    const minted = await mintSiteMagicLink({
      email: site.ownerEmail,
      slug: site.slug,
      baseUrl,
    });
    const welcomeLink = minted.ok
      ? minted.link
      : `${baseUrl}/site/${site.slug}`;
    if (!minted.ok) {
      console.error(
        "[chappieworks:intake] welcome magic link failed",
        site.slug,
        minted.error,
      );
    }

    const result = await sendWelcomeDashboard({
      to: site.ownerEmail,
      slug: site.slug,
      link: welcomeLink,
      businessName: site.businessName,
      ownerName: site.ownerName,
    });
    if (!result.ok) {
      console.error(
        "[chappieworks:intake] welcome email failed",
        site.slug,
        "error",
        result.error,
      );
    } else {
      console.log(
        "[chappieworks:intake] site provisioned",
        site.slug,
        "for",
        site.ownerEmail,
      );
    }

    if (isBypassEmail(site.ownerEmail)) {
      console.log(
        "[chappieworks:intake] bypass email — skipping $99 pay link",
        site.slug,
      );
    } else {
      const payResult = await sendLaunchPayLink({
        to: site.ownerEmail,
        businessName: site.businessName,
        ownerName: site.ownerName,
      });
      if (!payResult.ok) {
        console.error(
          "[chappieworks:intake] stripe pay-link email failed",
          site.slug,
          "error",
          payResult.error,
        );
      } else {
        console.log(
          "[chappieworks:intake] stripe pay-link emailed",
          site.slug,
          "to",
          site.ownerEmail,
        );
      }
    }
  } catch (err) {
    console.error("[chappieworks:intake] provision threw", err);
  }
}
