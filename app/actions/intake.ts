"use server";

import { revalidatePath } from "next/cache";

export type IntakeFormType = "agents" | "seo-audit" | "ads-audit";

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
};

const SUCCESS_COPY: Record<IntakeFormType, string> = {
  agents:
    "Got it. I'll send a one-page spec — scope, tier, price, ship date — within 24 hours.",
  "seo-audit":
    "Got it. Audit lands in your inbox in 48 hours. I'll ping within 24 to confirm scope.",
  "ads-audit":
    "Got it. Audit lands in your inbox in 48 hours. I'll ping within 24 to confirm access.",
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

  revalidatePath(`/${formType === "agents" ? "agents" : formType}`);

  return { ok: true, message: SUCCESS_COPY[formType] };
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
