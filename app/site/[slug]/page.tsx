import Link from "next/link";
import { notFound } from "next/navigation";
import { readSite } from "../../lib/sites";
import { readSessionFor } from "../../lib/siteAuth";
import { SiteLogin } from "./SiteLogin";
import { SiteDashboard } from "./SiteDashboard";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await readSite(slug);
  const title = site
    ? `${site.businessName} · edit dashboard — Chappie Works`
    : "Chappie Site · edit dashboard — Chappie Works";
  return {
    title,
    robots: { index: false, follow: false },
  };
}

export default async function SiteDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await readSite(slug);
  if (!site) return notFound();

  const session = await readSessionFor(slug);
  const authenticated = !!session && session.email === site.ownerEmail;

  return (
    <main>
      <section className="px-6 sm:px-10 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="text-sm mono text-[var(--color-mute)] hover:text-[var(--color-gold)]"
          >
            ← chappieworks
          </Link>

          <p className="text-xs mono text-[var(--color-gold)] mt-6 uppercase tracking-widest">
            Chappie Site · private dashboard
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-3 mb-2 leading-[1.1]">
            {site.businessName}
          </h1>
          {site.liveUrl ? (
            <p className="text-sm">
              <a
                href={site.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-gold)] hover:underline mono"
              >
                {site.liveUrl.replace(/^https?:\/\//, "")} ↗
              </a>
            </p>
          ) : null}

          <div className="mt-8">
            {authenticated ? (
              <SiteDashboard initialSite={site} />
            ) : (
              <SiteLogin slug={slug} ownerHint={site.ownerEmail} />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
