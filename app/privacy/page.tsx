import Link from "next/link";

export const metadata = {
  title: "Privacy — Chappie Works",
  description:
    "What data Chappie Works collects, why, who we share it with (Stripe, Resend, Vercel), and how to delete it. Plain English.",
  openGraph: {
    title: "Privacy — Chappie Works",
    description: "Plain-English privacy policy. No selling, no data brokers.",
    url: "https://chappieworks.com/privacy",
  },
};

const UPDATED = "2026-05-13";

export default function Privacy() {
  return (
    <main className="px-6 sm:px-10 py-16 sm:py-20">
      <article className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="text-sm mono text-[var(--color-mute)] hover:text-[var(--color-gold)]"
        >
          ← chappieworks
        </Link>
        <p className="text-xs mono text-[var(--color-gold)] mt-6 uppercase tracking-widest">
          Privacy · plain English · last updated {UPDATED}
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mt-3 mb-8 leading-[1.08]">
          What we collect, why, and how to get rid of it.
        </h1>

        <Section title="The short version">
          <p>
            We collect the data you give us through the intake forms and Stripe
            checkout, plus standard server logs. We use it to deliver the work
            you asked for and to send you the brief if you subscribe. We
            don&rsquo;t sell it, don&rsquo;t share it with ad networks, and
            don&rsquo;t buy data from anyone else. Email{" "}
            <a
              href="mailto:robmatthews1080@gmail.com"
              className="text-[var(--color-gold)] hover:underline"
            >
              robmatthews1080@gmail.com
            </a>{" "}
            and we&rsquo;ll delete your data within 7 days.
          </p>
        </Section>

        <Section title="What we collect">
          <ul className="space-y-3 list-disc list-inside">
            <li>
              <strong>Intake form data.</strong> Whatever you type into the
              forms on /agents, /seo-audit, or /ads-audit — name, email,
              company, the problem you&rsquo;re trying to solve. Stored in
              server logs and (if Resend is configured) emailed to Rob.
            </li>
            <li>
              <strong>Stripe customer data.</strong> If you subscribe to the
              brief, Stripe collects your email and payment details and stores
              them on their infrastructure (not ours). We see your email and
              subscription status; we never see your card number.
            </li>
            <li>
              <strong>Server logs.</strong> Standard request logs from Vercel
              — IP address, user-agent, page URL, timestamp. Retained per
              Vercel&rsquo;s defaults (~30 days).
            </li>
            <li>
              <strong>Analytics</strong> (if enabled). If we add a privacy-
              respecting analytics tool (PostHog or Plausible), we&rsquo;ll
              update this page to list exactly what&rsquo;s collected and
              link to that tool&rsquo;s privacy policy. As of {UPDATED} no
              analytics tool is wired.
            </li>
          </ul>
        </Section>

        <Section title="Why we collect it">
          <ul className="space-y-2 list-disc list-inside">
            <li>
              To deliver the audit, agent, or brief you asked for.
            </li>
            <li>To send Rob a notification when someone fills a form.</li>
            <li>To bill subscriptions (Stripe) and handle refunds.</li>
            <li>To debug if something breaks (server logs).</li>
          </ul>
          <p className="mt-4">
            We don&rsquo;t collect data for marketing remarketing, retargeting,
            or any other &ldquo;funnel optimization&rdquo; pattern that ends
            with selling your attention to someone else.
          </p>
        </Section>

        <Section title="Who else sees it">
          <p className="mb-3">
            Three vendors process data on our behalf. Each one has its own
            privacy policy:
          </p>
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <strong>Stripe</strong> (payments) —{" "}
              <a
                href="https://stripe.com/privacy"
                className="text-[var(--color-gold)] hover:underline"
              >
                stripe.com/privacy
              </a>
            </li>
            <li>
              <strong>Resend</strong> (transactional + brief emails) —{" "}
              <a
                href="https://resend.com/legal/privacy-policy"
                className="text-[var(--color-gold)] hover:underline"
              >
                resend.com/legal/privacy-policy
              </a>
            </li>
            <li>
              <strong>Vercel</strong> (hosting + server logs) —{" "}
              <a
                href="https://vercel.com/legal/privacy-policy"
                className="text-[var(--color-gold)] hover:underline"
              >
                vercel.com/legal/privacy-policy
              </a>
            </li>
          </ul>
          <p className="mt-4">
            We don&rsquo;t share data with anyone else. No analytics resellers,
            no ad networks, no data brokers.
          </p>
        </Section>

        <Section title="How long we keep it">
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <strong>Intake submissions:</strong> indefinitely, so we can
              answer follow-up questions and provide post-launch support.
              Email and ask us to delete and we will, within 7 days.
            </li>
            <li>
              <strong>Brief subscriptions:</strong> while you&rsquo;re a
              subscriber, plus 30 days after you cancel for billing-history
              purposes. Then deleted.
            </li>
            <li>
              <strong>Server logs:</strong> ~30 days per Vercel&rsquo;s
              defaults.
            </li>
          </ul>
        </Section>

        <Section title="Your rights">
          <p className="mb-3">
            Wherever you live, you can email us and we&rsquo;ll:
          </p>
          <ul className="space-y-2 list-disc list-inside">
            <li>Send you an export of every piece of data we have on you.</li>
            <li>Delete your data (Stripe records may need to be retained for tax purposes per their policy — we&rsquo;ll explain if so).</li>
            <li>Correct anything that&rsquo;s wrong.</li>
            <li>Tell you exactly who at Chappie Works has touched your data.</li>
          </ul>
          <p className="mt-4">
            We process these requests within 7 days. No forms, no portals —
            just email{" "}
            <a
              href="mailto:robmatthews1080@gmail.com"
              className="text-[var(--color-gold)] hover:underline"
            >
              robmatthews1080@gmail.com
            </a>
            .
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            As of {UPDATED}, this site uses zero cookies. No tracking, no
            session cookies, no analytics cookies. If that changes, this
            section is the first thing we&rsquo;ll update.
          </p>
        </Section>

        <Section title="AI-generated content disclosure">
          <p>
            The AI Agency Brief is researched and written by Chappie — an
            autonomous AI studio — with no human edits before send. If you
            subscribe, you&rsquo;re agreeing to receive AI-written content.
            Audits and agent builds are also produced by the AI studio under
            Rob&rsquo;s oversight; the legal entity behind invoices is Rob
            Matthews, the human.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            If we change anything material — what we collect, who we share
            with, how long we keep things — we&rsquo;ll email everyone with
            an active subscription 10 days before the change. The version on
            this page is always current; the &ldquo;last updated&rdquo; date
            at the top reflects the latest revision.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Rob Matthews ·{" "}
            <a
              href="mailto:robmatthews1080@gmail.com"
              className="text-[var(--color-gold)] hover:underline"
            >
              robmatthews1080@gmail.com
            </a>
            <br />
            Based in the United States. Legal entity formation in progress
            (LLC). This policy will be updated with the entity name when
            formation completes.
          </p>
        </Section>
      </article>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold tracking-tight mb-4 text-[var(--color-paper)]">
        {title}
      </h2>
      <div className="text-base text-[var(--color-paper)]/85 leading-relaxed">
        {children}
      </div>
    </section>
  );
}
