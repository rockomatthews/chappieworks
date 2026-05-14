# Brief Stripe checkout — one-time setup

The AI Agency Brief subscribe buttons read two `NEXT_PUBLIC_STRIPE_LINK_BRIEF_*` env vars. Until they're set, the buttons render as a disabled "Setting up checkout · back shortly" state. Set both env vars in Vercel and the buttons go live on the next deploy.

## What to create in the Stripe dashboard

Stripe → Products → **+ Add product**, twice:

| Tier | Product name | Price | Billing | Trial |
|---|---|---|---|---|
| Email | `The AI Agency Brief — Email` | $29 USD | Monthly, recurring | 7 days free |
| Email + Slack | `The AI Agency Brief — Email + Slack` | $59 USD | Monthly, recurring | 7 days free |

For each product, click **Create payment link** with these settings:

- **Collect email:** on (required so we know where to send the brief)
- **Allow promotion codes:** off (for now)
- **Phone collection:** off
- **Billing / Free trial:** **7 days**, no payment method required up front *(or "Payment method required" if you want to filter for committed buyers — Skeptic's pick)*
- **Confirmation page → After payment:** **Redirect to your own page** → `https://chappieworks.com/brief/thanks`
- **Allow customers to update their subscription / change plan:** on (lets buyers upgrade Email → Email+Slack without canceling)
- **Allow customers to cancel from receipt / portal:** on (matches the "cancel any day" promise on the page)

Copy each resulting `https://buy.stripe.com/...` URL.

## Paste the URLs into Vercel

Project Settings → Environment Variables → add two vars in **Production**:

```
NEXT_PUBLIC_STRIPE_LINK_BRIEF_EMAIL=https://buy.stripe.com/...
NEXT_PUBLIC_STRIPE_LINK_BRIEF_PLUS=https://buy.stripe.com/...
```

Then redeploy: Deployments → latest → ⋯ → Redeploy. The two disabled buttons on `/brief/ai-agency#pricing` activate immediately.

## Local dev

Copy `.env.example` to `.env.local` (gitignored) and paste the same two URLs. `npm run dev` and the buttons activate.

## Pipeline env vars — set these BEFORE enabling the Subscribe buttons

The brief generator at `app/api/cron/brief/route.ts` fires daily at 11:00 UTC (5am MDT) via Vercel Cron. It needs 4 additional env vars in Vercel (all server-only, no `NEXT_PUBLIC_` prefix):

| Var | Where to get it | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API keys | Claude Opus call for content distillation |
| `STRIPE_SECRET_KEY` | Stripe dashboard → Developers → API keys → Secret key | Pull active subscriber emails |
| `STRIPE_PRODUCT_ID_BRIEF` | Stripe → Products → The Brief product → Product ID (starts with `prod_`) | Filter subscriptions to Brief subscribers only |
| `CRON_SECRET` | Vercel auto-generates — or set any random string (32+ chars) | Auth header Vercel passes to the cron endpoint |

Add all four to Vercel → Project Settings → Environment Variables → Production. The cron is inactive until Vercel Cron is triggered (it runs automatically after the next deploy once `vercel.json` is in the build).

## Fulfillment — what happens when someone subscribes

Stripe sends them a receipt → they land on `/brief/thanks`. The pipeline at `/api/cron/brief` queries Stripe for active subscribers each morning and sends each one a fresh brief. **No manual steps needed once all env vars are set.**

If Stripe isn't configured yet: the cron returns `{ ok: true, sent: 0, preview: "..." }` with the generated brief in the response body — so you can verify the content looks right before enabling subscriptions.

## Risk note

The page promises "first brief at 6am MDT tomorrow." The generator is coded and scheduled — the only remaining step is setting the 6 env vars above (2 Stripe links + 4 pipeline vars). Once those are in Vercel and a subscriber comes in, the pipeline is fully autonomous.

Skeptic's standing recommendation: set all env vars in a single Vercel session so there's no window where buttons are live but the pipeline is broken. Order: pipeline env vars first → confirm cron fires with no subscribers (returns preview) → then enable Stripe links.
