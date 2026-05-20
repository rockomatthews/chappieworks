import Link from "next/link";
import { notFound } from "next/navigation";
import { isOperator } from "../../../lib/siteAuth";
import { readSite } from "../../../lib/sites";
import { OperatorDetail } from "./OperatorDetail";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Studio · site edit thread — Chappie Works",
  robots: { index: false, follow: false },
};

export default async function SiteEditDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!(await isOperator())) {
    return (
      <main>
        <section className="px-6 sm:px-10 py-16">
          <div className="max-w-md mx-auto">
            <Link
              href="/studio/site-edits"
              className="text-sm mono text-[var(--color-mute)] hover:text-[var(--color-gold)]"
            >
              ← Sign in
            </Link>
            <p className="mt-6 text-sm">Operator sign-in required.</p>
          </div>
        </section>
      </main>
    );
  }

  const { slug } = await params;
  const site = await readSite(slug);
  if (!site) return notFound();

  return (
    <main>
      <section className="px-6 sm:px-10 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/studio/site-edits"
            className="text-sm mono text-[var(--color-mute)] hover:text-[var(--color-gold)]"
          >
            ← Inbox
          </Link>
          <OperatorDetail initialSite={site} />
        </div>
      </section>
    </main>
  );
}
