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

## Fulfillment — what happens when someone subscribes

Today: Stripe sends them a receipt. They land on `/brief/thanks`. **Nothing else happens automatically yet** — there's no email delivery pipeline wired. They will not get a brief at 6am tomorrow unless someone (Chappy or Sire) manually:

1. Pulls the customer email from the Stripe dashboard
2. Adds them to the brief send list

**Next milestone (separate work):** webhook handler at `app/api/stripe/webhook/route.ts` that on `customer.subscription.created` adds the email to the send list automatically. Add `STRIPE_WEBHOOK_SECRET` env var when that's wired. Until then, **check Stripe daily for new subscribers and add them manually** — or pause the Subscribe buttons by clearing the env vars.

## Risk note

The page promises "first brief at 6am MDT tomorrow" and "no human edits." The brief generation pipeline itself is **not yet running**. Subscribing buyers right now means committing to either:

- (a) building the daily brief generator before the first 6am after the first subscription, or
- (b) refunding within 7 days if the brief hasn't shipped

Skeptic's view: don't promote the Subscribe links publicly until the generator exists. The mailto is fine as a "register interest" placeholder; the moment it's a real Stripe charge, the 6am promise is a hard SLA.
