"use server";

import { createHmac } from "crypto";
import { after } from "next/server";
import { revalidatePath } from "next/cache";

export type IntakeFormType =
  | "agents"
  | "seo-audit"
  | "ads-audit"
  | "photoshoot"
  | "website";

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
};

const SUCCESS_COPY: Record<IntakeFormType, string> = {
  agents:
    "Got it. I'll send a one-page spec — scope, tier, price, ship date — within 24 hours.",
  "seo-audit":
    "Got it. Audit is running now. PDF lands in your inbox in minutes from intake@chappieworks.com — check spam just in case.",
  "ads-audit":
    "Got it. Audit lands in your inbox in 48 hours. I'll ping within 24 to confirm access.",
  photoshoot:
    "Got it. The studio is generating your 3-image preview right now. Look for it in your inbox in 2–3 minutes from intake@chappieworks.com — check spam just in case.",
  website:
    "Got it. The studio has your brief. You'll get a Stripe link for the $99 launch fee within a few hours from intake@chappieworks.com — check spam just in case. Pay it and your site goes live within 48 hours.",
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

  // If it's a photoshoot preview, kick off the image-generation pipeline.
  if (formType === "photoshoot" && submission.fields.brand_description) {
    after(() => triggerPhotoshoot(submission));
  }

  revalidatePath(`/${formType === "agents" ? "agents" : formType}`);

  return { ok: true, message: SUCCESS_COPY[formType] };
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

async function triggerPhotoshoot(submission: {
  formType: IntakeFormType;
  name: string;
  email: string;
  fields: Record<string, string>;
}) {
  const secret = process.env.INTAKE_WEBHOOK_SECRET;
  if (!secret) {
    console.error(
      "[chappieworks:intake] INTAKE_WEBHOOK_SECRET not set — cannot trigger photoshoot",
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
    brand_name: submission.fields.brand_name,
    brand_description: submission.fields.brand_description,
    industry: submission.fields.industry,
    vibe: submission.fields.vibe,
    color_palette: submission.fields.color_palette,
    reference_url: submission.fields.reference_url,
  };
  const body = JSON.stringify(payload);
  const sig = createHmac("sha256", secret).update(body).digest("hex");

  try {
    const res = await fetch(`${baseUrl}/api/photoshoot/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-chappie-sig": sig,
      },
      body,
    });
    if (!res.ok) {
      console.error(
        "[chappieworks:intake] photoshoot trigger failed",
        res.status,
        await res.text(),
      );
    } else {
      console.log(
        "[chappieworks:intake] photoshoot triggered for",
        submission.email,
      );
    }
  } catch (err) {
    console.error("[chappieworks:intake] photoshoot trigger threw", err);
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
