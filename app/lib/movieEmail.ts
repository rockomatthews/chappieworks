// Shared email helpers for the /movie SKU. Used by the Stripe webhook
// (after a paid checkout) and by the checkout route's bypass path (when
// state.email matches BYPASS_CHECKOUT_EMAIL).

export async function sendCleanMovieEmail(opts: {
  to: string;
  jobId: string;
  prompt: string;
  cleanUrl: string;
  bypass?: boolean;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INTAKE_FROM_EMAIL ?? "intake@chappieworks.com";
  const bcc = process.env.INTAKE_NOTIFY_EMAIL;
  if (!apiKey) return;

  const shareUrl = `https://chappieworks.com/m/${opts.jobId}`;
  const subject = opts.bypass
    ? "Your Chappie Works movie (internal bypass)"
    : "Your unwatermarked Chappie Works movie";
  const ribbon = opts.bypass ? "Internal · Bypass" : "Movie · Unlocked";

  const html = `<!DOCTYPE html><html><body style="font-family: -apple-system, system-ui, sans-serif; background:#0b0b0c; color:#faf7ee; padding:32px 16px; margin:0;">
<div style="max-width:600px; margin:0 auto;">
<div style="border-bottom:2px solid #c9a437; padding-bottom:14px; margin-bottom:24px;">
  <div style="font-family:'SF Mono', monospace; font-size:11px; color:#c9a437; letter-spacing:0.12em; text-transform:uppercase;">Chappie Works · ${ribbon}</div>
  <h1 style="font-size:22px; margin:8px 0 0; font-weight:600;">Watermark removed. HD download ready.</h1>
</div>
<p style="font-size:15px; line-height:1.6; color:rgba(250,247,238,0.85);">${opts.bypass ? "Internal delivery — no charge. Clean MP4 below." : "Thanks for the purchase. Your clean, unwatermarked MP4 is ready."}</p>
<div style="background:#161616; border:1px solid #2a2a2a; border-radius:8px; padding:16px; margin:20px 0;">
  <div style="font-family:'SF Mono', monospace; font-size:11px; color:#c9a437; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:6px;">Prompt</div>
  <div style="font-size:14px; color:rgba(250,247,238,0.85); line-height:1.5;">${escapeHtml(opts.prompt)}</div>
</div>
<p style="margin: 28px 0;">
  <a href="${opts.cleanUrl}" style="display:inline-block; background:#c9a437; color:#0b0b0c; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:600; font-size:15px; margin-right:8px;">Download HD MP4 →</a>
  <a href="${shareUrl}" style="display:inline-block; border:1px solid rgba(201,164,55,0.4); color:#c9a437; padding:11px 22px; border-radius:6px; text-decoration:none; font-size:14px;">Watch on chappieworks.com</a>
</p>
<p style="font-size:14px; line-height:1.6; color:rgba(250,247,238,0.7);">Commercial rights yours. Use it on your site, ads, social, decks — wherever.</p>
<div style="font-size:13px; line-height:1.55; color:rgba(250,247,238,0.55); border-top:1px solid #2a2a2a; padding-top:18px; margin-top:32px;">
  <p style="margin:0 0 8px;">Liked it? Generate another at <a href="https://chappieworks.com/movie" style="color:#c9a437;">chappieworks.com/movie</a>.</p>
  <p style="margin:0;">Want an AI agent that does this on autopilot for your team? <a href="https://chappieworks.com/agents" style="color:#c9a437;">Brief a build</a>.</p>
</div>
</div>
</body></html>`;

  const payload: Record<string, unknown> = {
    from: `Chappie Works <${from}>`,
    to: [opts.to],
    reply_to: bcc ?? from,
    subject,
    html,
  };
  if (bcc) payload.bcc = [bcc];

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c] ?? c,
  );
}

// Normalize email for comparison: lowercase + trim. Used by the bypass
// check so casing differences don't matter ("Rob@FastWebWork.com" matches).
export function normalizeEmail(e: string | null | undefined): string {
  return (e ?? "").trim().toLowerCase();
}

// Returns true if the supplied email matches the bypass email configured
// via BYPASS_CHECKOUT_EMAIL. Returns false if no bypass is configured.
export function isBypassEmail(email: string | null | undefined): boolean {
  const bypass = normalizeEmail(process.env.BYPASS_CHECKOUT_EMAIL);
  if (!bypass) return false;
  return normalizeEmail(email) === bypass;
}
