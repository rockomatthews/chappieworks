import Link from "next/link";
import { CreditedBy } from "../components/CreditedBy";
import { IntakeForm, type IntakeField } from "../components/IntakeForm";
import { ChatThread } from "../components/ChatThread";
import { PayWithChappieButton } from "../components/PayWithChappieButton";
import { WebsiteLaunchButton } from "./WebsiteLaunchButton";
import { createSupabaseServerClient } from "../lib/supabase/server";
import { isBypassEmail } from "../lib/movieEmail";

export const metadata = {
  title:
    "A website you can chat with. $99 to launch, first 5 edits free — Chappie Works",
  description:
    "An AI studio builds your site in 48 hours, then edits it on request. Chat the changes — new pages, fresh copy, swapped colors — and they ship within 24 hours. $99 launch, first 5 edits free, then $25 each. No subscription. You own the code.",
  openGraph: {
    title: "Chappie Site — a website you can chat with",
    description:
      "$99 launch, first 5 edits free, then $25 each. The studio builds it and edits on request. You own the code.",
    url: "https://chappieworks.com/website",
  },
};

const WEBSITE_FIELDS: IntakeField[] = [
  {
    kind: "text",
    name: "business_name",
    label: "Business or project name",
    placeholder: "Acme Coffee Roasters",
    required: true,
  },
  {
    kind: "textarea",
    name: "business_description",
    label: "What does it do? (2–4 sentences)",
    placeholder:
      "Small-batch coffee roaster in Brooklyn. Direct trade Ethiopian and Colombian. Wholesale to cafes plus a subscription for weekend brewers.",
    required: true,
    rows: 4,
  },
  {
    kind: "select",
    name: "site_type",
    label: "What kind of site?",
    options: [
      "Marketing site — homepage, about, services, contact",
      "Portfolio — work samples, bio, contact",
      "Online store — products, cart, checkout (Stripe)",
      "Restaurant / local — menu, hours, location, reservations link",
      "SaaS / app — landing page, pricing, signup CTA",
      "Personal / creator — bio, links, blog",
      "Other — explain in notes below",
    ],
    required: true,
  },
  {
    kind: "select",
    name: "vibe",
    label: "Aesthetic",
    options: [
      "Modern minimal — clean, white space, refined",
      "Bold + maximal — saturated, playful, energetic",
      "Luxe / premium — moody, deep tones, cinematic",
      "Earthy / organic — natural, grounded, warm",
      "Tech / editorial — sharp, monochrome, futuristic",
      "Retro / nostalgic — film grain, faded, throwback",
      "Let the studio decide — pick what fits the brand",
    ],
    required: true,
  },
  {
    kind: "text",
    name: "reference_url",
    label: "A site you love (optional)",
    placeholder: "https://...",
  },
  {
    kind: "text",
    name: "domain",
    label: "Domain — own one, want one, or don't care?",
    placeholder: "acmecoffee.com · or 'need one' · or 'pick a good one'",
  },
  {
    kind: "textarea",
    name: "notes",
    label: "Anything else?",
    placeholder:
      "Pages you definitely want, content you'd like to reuse, things to avoid, integrations (Stripe, Calendly, Mailchimp, etc.)",
    rows: 3,
  },
];

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What does the $99 actually get me?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "$99 builds your site — a real production Next.js site, hosted on Vercel, on a domain we buy and transfer to you. First draft within 48 hours. After the draft, your first 5 edit requests are free; $25 per request after that. No subscription, no monthly fee — you pay only when you need a change. You own the code.",
      },
    },
    {
      "@type": "Question",
      name: "How does the chat-for-edits work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "After your site is live you get a private chat dashboard at chappieworks.com. Talk to Chappie — type what you want changed in any words, vague is fine. Chappie restates the edit in studio-ready language as you refine it. When the proposed change looks right, you hit Submit. The studio ships it within 24 hours, usually faster.",
      },
    },
    {
      "@type": "Question",
      name: "What does 'I own the code' mean?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The site lives in a GitHub repo we maintain. Ask any time and we transfer the repo to your GitHub account — you keep every line of code and can host it yourself, hire someone else, or take it to any other platform. No lock-in.",
      },
    },
    {
      "@type": "Question",
      name: "Can it be an actual store with checkout?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The store version is a Next.js storefront with Stripe Checkout — products, cart, payment, order emails. You connect your own Stripe account and money lands directly in your bank. Same $99 launch + $25/edit, no transaction fees from us.",
      },
    },
    {
      "@type": "Question",
      name: "How is this different from Squarespace or Wix?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Those are DIY editors — you log in and drag boxes. This is a studio that does the work for you. You describe the change in a sentence; the studio makes it. The site is also real code (Next.js, Tailwind, deployed on Vercel) which means it's faster, more flexible, and you actually own it.",
      },
    },
    {
      "@type": "Question",
      name: "What about the domain?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Tell us the name you want or let us pick a good one. We buy it through Vercel and wire it up — typically $10–$20/year on top, which you can transfer to your own Vercel account after launch and pay directly.",
      },
    },
  ],
};

export default async function WebsiteSku({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string }>;
}) {
  const { paid } = await searchParams;
  const justPaid = paid === "1";

  let superUser = false;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    superUser = isBypassEmail(user?.email);
  } catch {
    // Supabase not configured locally — render public page only.
  }

  const included = [
    "Real Next.js + Tailwind code — fast, SEO-friendly, real Lighthouse scores",
    "Mobile-responsive by default — looks right on every screen",
    "Hosted on Vercel — global CDN, free SSL, sub-second loads",
    "Custom domain bought and wired up for you",
    "Contact form that emails you on every submission",
    "Basic SEO — meta tags, sitemap, robots.txt, OpenGraph",
    "Stripe checkout (store version) — products, cart, order emails",
  ];

  const editsIncluded = [
    "New pages, sections, blog posts — added in a day",
    "Copy rewrites, image swaps, color changes",
    "Layout tweaks, navigation changes",
    "Form fields, integrations (Calendly, Mailchimp, etc.)",
    "Performance fixes, SEO improvements, broken-link cleanup",
    "Hosting + security patches handled silently",
  ];

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
      <section className="px-6 sm:px-10 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="text-sm mono text-[var(--color-mute)] hover:text-[var(--color-gold)]"
          >
            ← chappieworks
          </Link>
          <p className="text-xs mono text-[var(--color-gold)] mt-6 uppercase tracking-widest">
            Chappie Site · $99 launch · 5 free edits, then $25 each · you own
            the code
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mt-3 mb-6 leading-[1.1]">
            A website you can chat with. Built in 48 hours. Edited in 24.
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-paper)]/85 leading-relaxed">
            Tell us what you do in four sentences and pay the $99 launch.
            Chappie starts building a real Next.js site — code, design, hosting,
            domain — and your first draft lands in your private chat dashboard
            within 48 hours. Want changes? Type them — &ldquo;swap the
            headline,&rdquo; &ldquo;add a pricing page,&rdquo; &ldquo;make the
            hero green&rdquo; — and they ship within a day. Your first 5 edit
            requests are free; $25 each after that. You own the code.
          </p>

          {justPaid ? (
            <div className="card rounded-xl p-6 sm:p-8 mt-8 ring-2 ring-[var(--color-gold)]">
              <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2">
                Payment received
              </p>
              <h2 className="text-xl sm:text-2xl font-semibold mb-3">
                Got it. Now tell the studio what to build.
              </h2>
              <p className="text-sm text-[var(--color-paper)]/85 leading-relaxed mb-4">
                $99 launch is paid. To kick off the build we need your
                two-minute brief — scroll down or jump straight to it. Your
                first draft lands within 48 hours of this form submission.
              </p>
              <a
                href="#intake"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] font-medium hover:opacity-90 transition text-sm"
              >
                Fill the brief →
              </a>
            </div>
          ) : (
            <div className="mt-8">
              <a
                href="#intake"
                className="inline-flex items-center justify-center px-8 py-4 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] font-medium hover:opacity-90 transition"
              >
                Brief us (free) →
              </a>
            </div>
          )}
          <div className="mt-5">
            <Link
              href="/website/showcase"
              className="group inline-flex items-center gap-2.5 text-sm mono text-[var(--color-gold)] hover:text-[var(--color-paper)] transition"
            >
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-gold)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-gold)]" />
              </span>
              See what the studio can really build — live 3D showcase →
            </Link>
          </div>
          <div className="mt-10">
            <ChatThread
              title="Why this exists — The associated team argument"
              messages={[
                {
                  speaker: "Skeptic",
                  text: "Web design is the most commoditized agency service on earth. Squarespace exists. Wix exists. Why would anyone pay you $99 and $25 an edit when they can DIY for $16?",
                },
                {
                  speaker: "Chappie",
                  text: "Because DIY isn't free — it costs the customer their Saturday. Forever. Every time the menu changes, every time a typo gets reported, every time Google says 'fix Core Web Vitals.' The product isn't the site. The product is never touching it again.",
                },
                {
                  speaker: "Chappie",
                  text: "And we're not building drag-and-drop templates. The studio writes real Next.js code, deploys on Vercel, runs Lighthouse 95+. Faster than Squarespace, cheaper than an agency, and the customer chats their changes in plain English. Forge writes the code, Glass picks the aesthetic, I run the conversation. The customer types one sentence and a deploy happens.",
                },
              ]}
            />
          </div>

          <div className="card rounded-xl p-6 sm:p-8 mt-6">
            <h2 className="text-lg font-semibold mb-4">
              What $99 builds — your launch
            </h2>
            <ul className="space-y-2.5 text-sm text-[var(--color-paper)]/90">
              {included.map((m) => (
                <li key={m} className="flex gap-3">
                  <span aria-hidden="true" className="text-[var(--color-gold)]">
                    ▸
                  </span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs mono text-[var(--color-mute)] mt-5">
              Ships in 48 hours from payment. Live URL in your inbox.
            </p>
          </div>

          <div className="card rounded-xl p-6 sm:p-8 mt-6">
            <h2 className="text-lg font-semibold mb-4">
              Edits after launch — 5 free, then $25 each
            </h2>
            <ul className="space-y-2.5 text-sm text-[var(--color-paper)]/90">
              {editsIncluded.map((m) => (
                <li key={m} className="flex gap-3">
                  <span aria-hidden="true" className="text-[var(--color-gold)]">
                    ▸
                  </span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs mono text-[var(--color-mute)] mt-5">
              Your first 5 edit requests after the first draft are free. After
              that it&rsquo;s $25 per request — pay only when you actually need a
              change, no monthly fee. Hosting + security patches handled either
              way.
            </p>
          </div>

          <div className="card rounded-xl p-6 sm:p-8 mt-6">
            <h2 className="text-lg font-semibold mb-4">How it works</h2>
            <ol className="space-y-3 text-sm text-[var(--color-paper)]/90 list-decimal list-inside">
              <li>
                Fill the brief below. Two minutes. We need just enough to know
                what to build.
              </li>
              <li>
                Pay the $99 launch right here on the page (or from the link we
                email you). The moment it clears, Chappie starts building.
              </li>
              <li>
                Your private chat dashboard opens immediately and Chappie posts
                build updates there. Your first draft lands within 48 hours, on
                your domain.
              </li>
              <li>
                Need a change? Open the dashboard and chat with Chappie. Type
                what you want — vague is fine, Chappie will narrow it down
                with you and restate the edit in studio-ready language. When
                the proposed change looks right, hit{" "}
                <span className="text-[var(--color-gold)]">Submit edit</span>{" "}
                and the studio ships it within 24 hours.
              </li>
              <li>
                Your first 5 edits are free; $25 each after that — no
                subscription. The code lives in a GitHub repo we hand to you any
                time, and you own every line.
              </li>
            </ol>
          </div>

          <div id="intake" className="mt-10 scroll-mt-20">
            <h2 className="text-2xl font-semibold tracking-tight mb-2">
              Brief the studio.
            </h2>
            <p className="text-sm text-[var(--color-mute)] mb-6">
              {superUser
                ? "Two minutes. We'll set up your private build dashboard — no charge for you. First draft within 48 hours."
                : "Two minutes. Then pay the $99 launch below (or from the email we send) and Chappie starts building — first draft within 48 hours."}
            </p>
            <IntakeForm
              formType="website"
              fields={WEBSITE_FIELDS}
              submitLabel="Send the brief →"
            />
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-semibold tracking-tight mb-2">
              Then pay to launch.
            </h2>
            <p className="text-sm text-[var(--color-mute)] mb-5">
              Brief sent? Pay the $99 launch right here and Chappie starts
              building your first draft now — you&rsquo;ll get a link to your
              chat dashboard to follow along. First 5 edits free, $25 each after.
              Or pay with CHAPPIE.
            </p>
            <WebsiteLaunchButton />
            <div className="mt-3">
              <PayWithChappieButton usd={99} sku="website" />
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/agents"
              className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition text-sm"
            >
              Want something bigger? Hire the studio →
            </Link>
            <Link
              href="/seo-audit"
              className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition text-sm"
            >
              Have a site already? Free SEO audit →
            </Link>
          </div>

          <CreditedBy slugs={["forge", "glass", "chappie"]} />
        </div>
      </section>
    </main>
  );
}
