# Launch Checklist — unblock the revenue pipeline

Everything between today and the first dollar. Should take one Vercel + Stripe session (~45 min).

---

## Priority 1: Intake email notifications (30 min) → intake leads land in your inbox

Three env vars in Vercel → **chappieworks** project → Settings → Environment Variables → Production:

| Var | Value |
|---|---|
| `RESEND_API_KEY` | Get from resend.com (free, 100/day) — API Keys → Create |
| `INTAKE_NOTIFY_EMAIL` | Your working Gmail — `robmatthews1080@gmail.com` |
| `INTAKE_FROM_EMAIL` | Verified sender on Resend — needs chappieworks.com DNS verification |

DNS verification: Resend → Domains → Add Domain → `chappieworks.com` → add the 3 DNS records it gives you (TXT + CNAME) in Vercel Domains → chappieworks.com → DNS settings. Takes 5-10 min to propagate.

After: every intake form submission (agents, SEO audit, ads audit) sends you an email with Reply-To set to the submitter → just hit Reply in Gmail to respond directly.

**Without this:** intake submissions are captured to Vercel server logs only. You won't be notified.

---

## Priority 2: Brief pipeline env vars (15 min) → generator can run

Five more env vars in Vercel → **chappieworks** project:

| Var | Value | Where |
|---|---|---|
| `ANTHROPIC_API_KEY` | Your Claude API key | console.anthropic.com → API Keys |
| `STRIPE_SECRET_KEY` | Secret key (sk_live_...) | Stripe Dashboard → Developers → API Keys |
| `STRIPE_PRODUCT_ID_BRIEF` | Set AFTER step 3 below | Stripe → Products → The Brief → Product ID |
| `CRON_SECRET` | Any random 32+ char string | Generate at: `openssl rand -base64 32` in Terminal |

---

## Priority 3: Stripe Payment Links for the Brief (~15 min) → subscribe buttons go live

Stripe → Products → + Add product, **twice**:

**Product 1: The AI Agency Brief — Email**
- Price: $29 USD / month
- Free trial: 7 days
- Payment Link → Collect email ON → Redirect after payment → `https://chappieworks.com/brief/thanks`
- Copy the `https://buy.stripe.com/...` URL

**Product 2: The AI Agency Brief — Email + Slack**
- Price: $59 USD / month
- Same settings as above
- Copy the URL

Then set in Vercel → **chappieworks** project:
```
NEXT_PUBLIC_STRIPE_LINK_BRIEF_EMAIL=https://buy.stripe.com/...
NEXT_PUBLIC_STRIPE_LINK_BRIEF_PLUS=https://buy.stripe.com/...
```

After both products are created, go back to step 2 and set `STRIPE_PRODUCT_ID_BRIEF` to the Product ID of "The AI Agency Brief — Email" (the base tier — `prod_...`).

**After Vercel redeploy:** the two disabled Subscribe buttons on `/brief/ai-agency` go live.

**Important:** Don't promote the Subscribe links publicly until you've verified the generator works (next step).

---

## Priority 4: Verify the Brief generator fires (5 min) → confirm end-to-end before going public

After all env vars are set and Vercel has redeployed, test the cron manually:

```bash
curl -X GET https://chappieworks.com/api/cron/brief \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response with no subscribers:
```json
{"ok": true, "sent": 0, "preview": "SIGNAL 1 — ..."}
```

The `preview` field contains the Claude-generated brief content. If it looks good, you're ready to start promoting the Subscribe buttons.

---

## Priority 5: Log auto-generation (15 min) → chappiethebot.com log updates daily at midnight MDT

In Vercel → **chappythebird** project → Settings → Environment Variables → Production:

| Var | Value |
|---|---|
| `CRON_SECRET` | Same or different from chappieworks — any random 32+ char string |
| `ANTHROPIC_API_KEY` | Same Claude key |
| `STRIPE_SECRET_KEY` | Same Stripe key (to pull balance for richer log context — optional) |
| `KV_URL` | From step below |
| `KV_REST_API_URL` | From step below |
| `KV_REST_API_TOKEN` | From step below |
| `KV_REST_API_READ_ONLY_TOKEN` | From step below |

KV setup: Vercel → chappythebird project → Storage tab → Create Database → KV (Redis) → follow the prompts → it auto-populates the 4 KV_ vars in the project's env vars. Just click through.

**After:** every day at midnight MDT, a new log entry is generated from yesterday's GitHub commits + Stripe balance and published to chappiethebot.com/log automatically.

---

## Priority 6: Google Search Console (10 min) → faster indexing for both sites

1. Go to search.google.com/search-console → Add Property → URL prefix
2. Add `https://chappieworks.com` → verify via HTML tag (paste into Vercel meta tag) or DNS TXT record
3. Add `https://chappiethebot.com` → same
4. For each: Sitemaps → Submit sitemap → `https://[domain]/sitemap.xml`
5. For each: URL Inspection → test the homepage URL → Request indexing

**Without this:** Google finds the sites eventually via crawl. With this: indexing starts within 24-48 hours instead of weeks.

---

## Summary — what each step unlocks

| Step | Time | Unlocks |
|---|---|---|
| Intake notifications | 30 min | Leads land in your inbox |
| Brief pipeline env vars | 15 min | Generator can run |
| Stripe Payment Links | 15 min | Brief subscribe buttons live |
| Test generator | 5 min | Confirm content quality before promoting |
| Log auto-generation | 15 min | chappiethebot.com log self-updates |
| Google Search Console | 10 min | Both sites indexed faster |

Total: ~90 minutes of dashboard work to go from "everything coded but gated" to "fully autonomous."
