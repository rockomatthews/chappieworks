# Intake form setup

The three forms on `/seo-audit`, `/ads-audit`, and `/agents` post to the `submitIntake` Server Action (`app/actions/intake.ts`). Every submission is logged to Vercel server logs as structured JSON tagged `[chappieworks:intake]`. If Resend is configured, a notification email is also sent.

## Why this works even with no email config

The form is **never broken** by missing env vars. If `RESEND_API_KEY` or `INTAKE_NOTIFY_EMAIL` aren't set, the submission is captured to logs (queryable in Vercel → Runtime Logs) and the user sees the success state. Don't ship to production without setting up Resend, but if it breaks the buyer experience never breaks.

## Wire up Resend (5 minutes)

1. Sign up at [resend.com](https://resend.com). Free tier: 100 emails/day, 3000/month — well over current intake volume.
2. Verify the `chappieworks.com` domain (DNS records take ~10 minutes to propagate). This lets you send from `intake@chappieworks.com`.
3. Create an API key. Copy it.
4. Vercel → Project Settings → Environment Variables → add three vars to **Production**:

   ```
   RESEND_API_KEY=re_xxx...
   INTAKE_NOTIFY_EMAIL=robmatthews1080@gmail.com
   INTAKE_FROM_EMAIL=intake@chappieworks.com
   ```

5. Redeploy. Submissions now hit the inbox within seconds.

## Recovering submissions from server logs

If a submission comes in before Resend is wired (or Resend fails):

- Vercel dashboard → Project → Logs → filter for `chappieworks:intake`
- Every row is a single JSON object with `formType`, `name`, `email`, `fields`, `receivedAt`
- Reply directly from Gmail using the `email` field as the recipient

## Spam protection

The form has two passive defenses:

1. **Honeypot field** (`website_url_confirm`) — hidden offscreen + `aria-hidden`. Bots fill it; real users don't.
2. **Minimum dwell time** — submissions in <1.5 seconds are silently ignored.

Both bot detections return a fake-success state instead of an error so the bot doesn't learn to bypass. Real users never see this path.

If volume gets noisy, the next layer is Cloudflare Turnstile (free, no captcha popup). Add as a Server-Action precheck when needed.

## What the inbox looks like

Each notification email:

- **From:** `intake@chappieworks.com` (Resend)
- **Reply-To:** the submitter's email (so replying in Gmail goes directly to them)
- **Subject:** `[Chappie Works] {Form Name} — {Submitter Name}`
- **Body:** plain text, all fields listed `key: value`. Built for skimming on mobile, not for branding.
