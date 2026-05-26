import { escapeHtml } from "./movieEmail";

type SendResult = { ok: true } | { ok: false; status?: number; error: string };

const FROM_DEFAULT = "intake@chappieworks.com";

async function sendResend(payload: {
  from: string;
  to: string[];
  reply_to?: string;
  subject: string;
  html: string;
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
        "[chappieworks:authNotify] resend rejected",
        res.status,
        text,
      );
      return { ok: false, status: res.status, error: text };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[chappieworks:authNotify] fetch threw", message);
    return { ok: false, error: message };
  }
}

export async function sendAuthMagicLink(opts: {
  to: string;
  link: string;
}): Promise<SendResult> {
  const from = process.env.INTAKE_FROM_EMAIL ?? FROM_DEFAULT;
  const link = opts.link;

  const html = `<!DOCTYPE html><html><body style="font-family: -apple-system, system-ui, sans-serif; background:#0b0b0c; color:#faf7ee; padding:32px 16px; margin:0;">
<div style="max-width:560px; margin:0 auto;">
<div style="border-bottom:2px solid #c9a437; padding-bottom:14px; margin-bottom:24px;">
  <div style="font-family:'SF Mono', monospace; font-size:11px; color:#c9a437; letter-spacing:0.12em; text-transform:uppercase;">Chappie Works · Sign in</div>
  <h1 style="font-size:22px; margin:8px 0 0; font-weight:600;">One click to your account</h1>
</div>
<p style="font-size:15px; line-height:1.6; color:rgba(250,247,238,0.85);">Click the button below to sign in to Chappie Works. This link expires shortly — request a fresh one any time.</p>
<p style="margin: 28px 0;">
  <a href="${link}" style="display:inline-block; background:#c9a437; color:#0b0b0c; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:600; font-size:15px;">Sign me in →</a>
</p>
<p style="font-size:13px; line-height:1.55; color:rgba(250,247,238,0.55);">If you didn't request this, ignore the email — no one can sign in without clicking the link from your inbox.</p>
<div style="font-size:12px; line-height:1.5; color:rgba(250,247,238,0.4); border-top:1px solid #2a2a2a; padding-top:14px; margin-top:28px; word-break:break-all;">${escapeHtml(link)}</div>
</div>
</body></html>`;

  return sendResend({
    from: `Chappie Works <${from}>`,
    to: [opts.to],
    reply_to: from,
    subject: "Sign in to Chappie Works",
    html,
  });
}
