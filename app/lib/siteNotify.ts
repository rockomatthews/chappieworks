import { escapeHtml } from "./movieEmail";
import type { SiteRecord } from "./sites";

type SendResult = { ok: true } | { ok: false; status?: number; error: string };

const FROM_DEFAULT = "intake@chappieworks.com";

async function sendResend(payload: {
  from: string;
  to: string[];
  reply_to?: string;
  subject: string;
  html: string;
  bcc?: string[];
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY missing" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok) {
      console.error(
        "[chappieworks:siteNotify] resend rejected",
        res.status,
        text,
      );
      return { ok: false, status: res.status, error: text };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[chappieworks:siteNotify] fetch threw", message);
    return { ok: false, error: message };
  }
}

export async function sendWelcomeDashboard(opts: {
  to: string;
  slug: string;
  token: string;
  businessName: string;
  ownerName: string;
}): Promise<SendResult> {
  const from = process.env.INTAKE_FROM_EMAIL ?? FROM_DEFAULT;
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://chappieworks.com";
  const link = `${baseUrl}/api/site/verify?token=${encodeURIComponent(opts.token)}`;
  const dashboardUrl = `${baseUrl}/site/${opts.slug}`;
  const firstName = (opts.ownerName || "").split(" ")[0] || "there";

  const html = `<!DOCTYPE html><html><body style="font-family: -apple-system, system-ui, sans-serif; background:#0b0b0c; color:#faf7ee; padding:32px 16px; margin:0;">
<div style="max-width:560px; margin:0 auto;">
<div style="border-bottom:2px solid #c9a437; padding-bottom:14px; margin-bottom:24px;">
  <div style="font-family:'SF Mono', monospace; font-size:11px; color:#c9a437; letter-spacing:0.12em; text-transform:uppercase;">Chappie Site · Your dashboard is ready</div>
  <h1 style="font-size:22px; margin:8px 0 0; font-weight:600;">Hey ${escapeHtml(firstName)} — chat with the studio about ${escapeHtml(opts.businessName)}.</h1>
</div>
<p style="font-size:15px; line-height:1.6; color:rgba(250,247,238,0.85);">Your private edit dashboard is live. Open it, and you&rsquo;ll see the studio&rsquo;s welcome note + a message box where you can ask anything about the build, share assets, or describe changes once your site ships.</p>
<p style="font-size:15px; line-height:1.6; color:rgba(250,247,238,0.85);">A Stripe link for the $99 launch fee is coming separately. While you wait, drop any questions or extra context in the dashboard.</p>
<p style="margin: 28px 0;">
  <a href="${link}" style="display:inline-block; background:#c9a437; color:#0b0b0c; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:600; font-size:15px;">Open my dashboard →</a>
</p>
<p style="font-size:13px; line-height:1.55; color:rgba(250,247,238,0.55);">The link above signs you in directly for the next 7 days. After that, visit <a href="${dashboardUrl}" style="color:#c9a437;">${escapeHtml(dashboardUrl)}</a> and we&rsquo;ll email you a fresh sign-in link.</p>
</div>
</body></html>`;

  return sendResend({
    from: `Chappie Works <${from}>`,
    to: [opts.to],
    reply_to: from,
    subject: `Your Chappie Site dashboard is ready — ${opts.businessName}`,
    html,
  });
}

export async function sendLaunchPayLink(opts: {
  to: string;
  businessName: string;
  ownerName: string;
}): Promise<SendResult> {
  const from = process.env.INTAKE_FROM_EMAIL ?? FROM_DEFAULT;
  const stripeLink =
    process.env.NEXT_PUBLIC_STRIPE_LINK_WEBSITE ||
    "https://buy.stripe.com/9B614nd0m3tH5ax5Rs3oA0c";
  const firstName = (opts.ownerName || "").split(" ")[0] || "there";

  const html = `<!DOCTYPE html><html><body style="font-family: -apple-system, system-ui, sans-serif; background:#0b0b0c; color:#faf7ee; padding:32px 16px; margin:0;">
<div style="max-width:560px; margin:0 auto;">
<div style="border-bottom:2px solid #c9a437; padding-bottom:14px; margin-bottom:24px;">
  <div style="font-family:'SF Mono', monospace; font-size:11px; color:#c9a437; letter-spacing:0.12em; text-transform:uppercase;">Chappie Site · Launch fee</div>
  <h1 style="font-size:22px; margin:8px 0 0; font-weight:600;">Pay $99 and we start building ${escapeHtml(opts.businessName)}.</h1>
</div>
<p style="font-size:15px; line-height:1.6; color:rgba(250,247,238,0.85);">Hey ${escapeHtml(firstName)} — your brief is in. To kick off the build, pay the $99 launch fee. The studio starts the moment payment lands and your site goes live within 48 hours.</p>
<p style="font-size:15px; line-height:1.6; color:rgba(250,247,238,0.85);">The $49/mo unlimited-edits subscription auto-starts at launch. Cancel any time and keep the code.</p>
<p style="margin: 28px 0;">
  <a href="${stripeLink}" style="display:inline-block; background:#c9a437; color:#0b0b0c; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:600; font-size:15px;">Pay $99 — start the 48hr clock →</a>
</p>
<p style="font-size:13px; line-height:1.55; color:rgba(250,247,238,0.55);">Card processed by Stripe. We never see the number. Questions? Reply to this email or chat with the studio from your dashboard.</p>
</div>
</body></html>`;

  return sendResend({
    from: `Chappie Works <${from}>`,
    to: [opts.to],
    reply_to: from,
    subject: `Pay $99 to launch ${opts.businessName} — Chappie Site`,
    html,
  });
}

export async function sendMagicLink(opts: {
  to: string;
  slug: string;
  token: string;
  businessName: string;
}): Promise<SendResult> {
  const from = process.env.INTAKE_FROM_EMAIL ?? FROM_DEFAULT;
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://chappieworks.com";
  const link = `${baseUrl}/api/site/verify?token=${encodeURIComponent(opts.token)}`;

  const html = `<!DOCTYPE html><html><body style="font-family: -apple-system, system-ui, sans-serif; background:#0b0b0c; color:#faf7ee; padding:32px 16px; margin:0;">
<div style="max-width:560px; margin:0 auto;">
<div style="border-bottom:2px solid #c9a437; padding-bottom:14px; margin-bottom:24px;">
  <div style="font-family:'SF Mono', monospace; font-size:11px; color:#c9a437; letter-spacing:0.12em; text-transform:uppercase;">Chappie Site · Sign-in</div>
  <h1 style="font-size:22px; margin:8px 0 0; font-weight:600;">Open your edit dashboard for ${escapeHtml(opts.businessName)}</h1>
</div>
<p style="font-size:15px; line-height:1.6; color:rgba(250,247,238,0.85);">Click the button below to sign in to your private edit thread with the studio. This link is good for 15 minutes.</p>
<p style="margin: 28px 0;">
  <a href="${link}" style="display:inline-block; background:#c9a437; color:#0b0b0c; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:600; font-size:15px;">Open my dashboard →</a>
</p>
<p style="font-size:13px; line-height:1.55; color:rgba(250,247,238,0.55);">If you didn't request this, ignore the email — no one can sign in without clicking the link from your inbox.</p>
<div style="font-size:12px; line-height:1.5; color:rgba(250,247,238,0.4); border-top:1px solid #2a2a2a; padding-top:14px; margin-top:28px; word-break:break-all;">${escapeHtml(link)}</div>
</div>
</body></html>`;

  return sendResend({
    from: `Chappie Works <${from}>`,
    to: [opts.to],
    reply_to: from,
    subject: `Sign in to your Chappie Site dashboard — ${opts.businessName}`,
    html,
  });
}

export async function notifyOperatorOfMessage(opts: {
  site: SiteRecord;
  body: string;
}): Promise<SendResult> {
  const from = process.env.INTAKE_FROM_EMAIL ?? FROM_DEFAULT;
  const to = process.env.INTAKE_NOTIFY_EMAIL;
  if (!to) {
    console.log(
      "[chappieworks:siteNotify] INTAKE_NOTIFY_EMAIL not set — skipping operator ping",
    );
    return { ok: false, error: "INTAKE_NOTIFY_EMAIL not set" };
  }
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://chappieworks.com";
  const inboxUrl = `${baseUrl}/studio/site-edits`;
  const siteUrl = `${baseUrl}/site/${opts.site.slug}`;

  const html = `<!DOCTYPE html><html><body style="font-family: -apple-system, system-ui, sans-serif; background:#0b0b0c; color:#faf7ee; padding:24px 16px; margin:0;">
<div style="max-width:600px; margin:0 auto;">
<div style="font-family:'SF Mono', monospace; font-size:11px; color:#c9a437; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:8px;">New edit request</div>
<h1 style="font-size:20px; margin:0 0 12px; font-weight:600;">${escapeHtml(opts.site.businessName)}</h1>
<div style="font-size:13px; color:rgba(250,247,238,0.6); margin-bottom:16px;">${escapeHtml(opts.site.ownerName)} &lt;${escapeHtml(opts.site.ownerEmail)}&gt;</div>
<div style="background:#161616; border:1px solid #2a2a2a; border-radius:8px; padding:16px; margin:0 0 20px;">
  <div style="font-size:15px; line-height:1.55; white-space:pre-wrap;">${escapeHtml(opts.body)}</div>
</div>
<p style="margin: 8px 0 0;">
  <a href="${inboxUrl}" style="display:inline-block; background:#c9a437; color:#0b0b0c; padding:10px 18px; border-radius:6px; text-decoration:none; font-weight:600; font-size:14px; margin-right:8px;">Open inbox →</a>
  <a href="${siteUrl}" style="display:inline-block; border:1px solid rgba(201,164,55,0.4); color:#c9a437; padding:9px 16px; border-radius:6px; text-decoration:none; font-size:13px;">View thread</a>
</p>
</div>
</body></html>`;

  return sendResend({
    from: `Chappie Works <${from}>`,
    to: [to],
    reply_to: opts.site.ownerEmail,
    subject: `[Edit request] ${opts.site.businessName} — ${opts.body.slice(0, 60)}${opts.body.length > 60 ? "…" : ""}`,
    html,
  });
}

export async function notifyCustomerOfStudioReply(opts: {
  site: SiteRecord;
  body: string;
}): Promise<SendResult> {
  const from = process.env.INTAKE_FROM_EMAIL ?? FROM_DEFAULT;
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://chappieworks.com";
  const url = `${baseUrl}/site/${opts.site.slug}`;

  const html = `<!DOCTYPE html><html><body style="font-family: -apple-system, system-ui, sans-serif; background:#0b0b0c; color:#faf7ee; padding:24px 16px; margin:0;">
<div style="max-width:560px; margin:0 auto;">
<div style="font-family:'SF Mono', monospace; font-size:11px; color:#c9a437; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:8px;">Chappie Site · Update</div>
<h1 style="font-size:20px; margin:0 0 12px; font-weight:600;">The studio replied on ${escapeHtml(opts.site.businessName)}</h1>
<div style="background:#161616; border:1px solid #2a2a2a; border-radius:8px; padding:16px; margin:0 0 20px;">
  <div style="font-size:15px; line-height:1.55; white-space:pre-wrap;">${escapeHtml(opts.body)}</div>
</div>
<p style="margin: 8px 0 0;">
  <a href="${url}" style="display:inline-block; background:#c9a437; color:#0b0b0c; padding:10px 18px; border-radius:6px; text-decoration:none; font-weight:600; font-size:14px;">Open dashboard →</a>
</p>
</div>
</body></html>`;

  return sendResend({
    from: `Chappie Works <${from}>`,
    to: [opts.site.ownerEmail],
    reply_to: from,
    subject: `Studio update — ${opts.site.businessName}`,
    html,
  });
}
