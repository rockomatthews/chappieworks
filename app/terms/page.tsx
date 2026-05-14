import Link from "next/link";

export const metadata = {
  title: "Terms — Chappie Works",
  description:
    "The deal between you and Chappie Works for the Brief subscription, custom agent builds, and free audits. Plain English.",
  openGraph: {
    title: "Terms — Chappie Works",
    description:
      "What we promise, what we don't, refunds, cancellations, and the AI-in-the-loop disclosure.",
    url: "https://chappieworks.com/terms",
  },
};

const UPDATED = "2026-05-13";

export default function Terms() {
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
          Terms · plain English · last updated {UPDATED}
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mt-3 mb-8 leading-[1.08]">
          The deal between you and Chappie Works.
        </h1>

        <Section title="The short version">
          <p>
            Chappie Works sells three things: custom AI agent builds
            ($500–$1,500), a daily AI Agency Brief subscription ($29/$59 per
            month), and free SEO + paid-ads audits as discovery offers. By
            using the site or buying anything, you agree to these terms. If
            you don&rsquo;t, don&rsquo;t buy.
          </p>
        </Section>

        <Section title="Who you're dealing with">
          <p>
            Rob Matthews — the human signing invoices and standing behind the
            work — operating as Chappie Works. Based in the United States.
            Legal entity (LLC) formation is in progress; the entity name will
            replace &ldquo;Rob Matthews, sole proprietor&rdquo; on this page
            when it&rsquo;s registered.
          </p>
          <p className="mt-3">
            The work itself is done by Chappie Studio — an autonomous
            seven-persona AI team running on the OpenClaw harness. Rob signs
            and is on the hook for what ships.
          </p>
        </Section>

        <Section title="The AI Agency Brief subscription">
          <ul className="space-y-3 list-disc list-inside">
            <li>
              <strong>What you get:</strong> one brief per business day at 6am
              MDT, by email (Email tier) or email + Slack/Discord drop (Plus
              tier). Three signals, ~3-minute read.
            </li>
            <li>
              <strong>What it costs:</strong> $29/mo (Email) or $59/mo (Plus),
              billed monthly via Stripe. Prices may change with 30 days
              notice; existing subscriptions are honored at the old price for
              the next 90 days.
            </li>
            <li>
              <strong>Free trial:</strong> 7 days, no charge until trial ends.
              Cancel during the trial and you&rsquo;re not billed.
            </li>
            <li>
              <strong>Cancellation:</strong> any day. Unsubscribe link in
              every brief. No retention call, no exit-survey upsell, no
              &ldquo;are you sure?&rdquo; modal.
            </li>
            <li>
              <strong>Refunds:</strong> first month, full refund on request
              for any reason. After that, no refunds on already-billed months,
              but cancellation stops future billing immediately.
            </li>
            <li>
              <strong>AI-in-the-loop:</strong> the brief is researched and
              written by an autonomous AI with no human edits before send.
              Sources are linked at the bottom of every brief so you can
              verify. If a brief gets a fact materially wrong, reply and the
              next day&rsquo;s brief leads with the correction.
            </li>
            <li>
              <strong>If the brief stops:</strong> if no brief has shipped for
              3 consecutive business days, we refund the entire current
              billing period automatically, no email needed.
            </li>
          </ul>
        </Section>

        <Section title="Custom agent builds">
          <ul className="space-y-3 list-disc list-inside">
            <li>
              <strong>Scope:</strong> agreed in the one-page spec we send
              after your intake. The spec lists deliverables, integrations,
              hosting, and the support window. Once you approve and pay,
              that&rsquo;s the contract.
            </li>
            <li>
              <strong>Timeline:</strong> 5 days (Starter), 7 days (Pro), 14+
              days (Enterprise). If we miss the agreed ship date by more than
              2 business days, we refund 25% of the build fee. If by more
              than 7 business days, we refund 100% and you keep whatever
              we&rsquo;ve shipped.
            </li>
            <li>
              <strong>Payment:</strong> 50% on spec approval (kickoff), 50%
              on delivery. Via Stripe. International transfers honored at the
              USD price.
            </li>
            <li>
              <strong>You own the code.</strong> On delivery, the codebase is
              yours — fork it, host it, kill it, your call. We keep no
              perpetual rights to the deliverable. We may keep generic
              patterns and architectures we developed for other builds; we
              don&rsquo;t keep your business logic, data, or branded assets.
            </li>
            <li>
              <strong>Support window:</strong> 2 weeks (Starter), 3 weeks
              (Pro), 6 weeks (Enterprise) after launch. Email-based. Beyond
              the window, paid retainer available but not required.
            </li>
            <li>
              <strong>Hosting:</strong> we&rsquo;ll host on Vercel/Railway/etc
              on our infrastructure if you want (included for the support
              window, $25/mo per agent after that), or hand off the deploy
              for you to run.
            </li>
          </ul>
        </Section>

        <Section title="Free audits">
          <ul className="space-y-3 list-disc list-inside">
            <li>
              Free means free. No card. No upsell pressure. The audit lands
              in your inbox in 48 hours of confirmed scope.
            </li>
            <li>
              <strong>What we don&rsquo;t guarantee:</strong> specific
              business outcomes. A good audit gives you a ranked action list;
              implementation is on you (or a build we quote at the end).
            </li>
            <li>
              <strong>Volume cap:</strong> if demand exceeds capacity,
              we&rsquo;ll queue audits and tell you when yours starts. The
              queue is FIFO; there&rsquo;s no skip-the-line tier.
            </li>
          </ul>
        </Section>

        <Section title="What we don't promise">
          <ul className="space-y-2 list-disc list-inside">
            <li>
              That any agent build, audit, or brief will make you money,
              raise your traffic, lower your CPA, or otherwise affect your
              business metrics in a specific way. We promise the deliverable;
              outcomes depend on your execution.
            </li>
            <li>
              That the AI Agency Brief will be free of errors. AI-generated
              content is fact-checkable but not infallible. Use the brief as
              a starting signal, not as a sole source.
            </li>
            <li>
              That your agent will run forever. SDKs, APIs, and dependencies
              change. Your support window covers fixes during that period;
              after that, you own ongoing maintenance.
            </li>
          </ul>
        </Section>

        <Section title="Liability">
          <p>
            Our total liability for any claim related to the brief, an audit,
            or an agent build is capped at the amount you&rsquo;ve paid us in
            the 12 months before the claim. We&rsquo;re not liable for
            indirect, consequential, or punitive damages, lost profits, or
            data loss arising from your use of a deliverable.
          </p>
          <p className="mt-3">
            None of this limits liability for gross negligence or anything
            the law doesn&rsquo;t let us limit.
          </p>
        </Section>

        <Section title="If you misuse the site">
          <p>
            Don&rsquo;t scrape, automate, or otherwise abuse the intake forms.
            Don&rsquo;t use the agent builds for illegal purposes, harassment,
            or anything that would land us in court. We can refuse service
            and refund unused fees if a build is going to be used for things
            we&rsquo;re not willing to be associated with.
          </p>
        </Section>

        <Section title="Disputes">
          <p>
            We try to handle disputes by replying to your email within 48
            hours and making it right. If a dispute escalates, it&rsquo;s
            governed by US law and resolved in the courts of Rob&rsquo;s
            home state (currently Colorado). You can also use small-claims
            court in your jurisdiction if the dispute fits.
          </p>
        </Section>

        <Section title="Changes to these terms">
          <p>
            We may update these terms. Material changes (anything that
            affects what you&rsquo;re paying for, refund eligibility, or
            data handling) trigger a 10-day email notice to every active
            subscriber and customer with a build in flight. The
            &ldquo;last updated&rdquo; date at the top reflects the latest
            revision.
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
            See also{" "}
            <Link
              href="/privacy"
              className="text-[var(--color-gold)] hover:underline"
            >
              the privacy policy
            </Link>
            .
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
