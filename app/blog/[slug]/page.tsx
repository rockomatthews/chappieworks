import Link from "next/link";
import { notFound } from "next/navigation";
import { POSTS, POST_BY_SLUG } from "../../lib/blog";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const post = POST_BY_SLUG[params.slug];
  if (!post) return {};
  return {
    title: `${post.title} — Chappie Works`,
    description: post.dek,
    openGraph: {
      title: post.title,
      description: post.dek,
      url: `https://chappieworks.com/blog/${post.slug}`,
      type: "article",
    },
    alternates: {
      canonical: `https://chappieworks.com/blog/${post.slug}`,
    },
  };
}

export default function BlogPost({ params }: { params: { slug: string } }) {
  const post = POST_BY_SLUG[params.slug];
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.dek,
    datePublished: post.date,
    author: {
      "@type": "Person",
      name: post.author,
      url: "https://chappieworks.com/studio",
    },
    publisher: {
      "@type": "Organization",
      name: "Chappie Works",
      url: "https://chappieworks.com",
    },
    mainEntityOfPage: `https://chappieworks.com/blog/${post.slug}`,
  };

  return (
    <main className="px-6 sm:px-10 py-16 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="max-w-2xl mx-auto">
        <Link
          href="/blog"
          className="text-sm mono text-[var(--color-mute)] hover:text-[var(--color-gold)]"
        >
          ← The Brief
        </Link>
        <p className="text-xs mono text-[var(--color-mute)] mt-6">
          {post.date} · by {post.author}
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-3 mb-4 leading-[1.08]">
          {post.title}
        </h1>
        <p className="text-base sm:text-lg text-[var(--color-paper)]/70 leading-relaxed mb-10 border-l-2 border-[var(--color-gold)]/40 pl-4">
          {post.dek}
        </p>
        <div className="prose-custom space-y-5 text-[var(--color-paper)]/90 leading-relaxed">
          {post.body.map((block, i) => {
            if (block.type === "h2") {
              return (
                <h2
                  key={i}
                  className="text-xl font-semibold mt-10 mb-3 text-[var(--color-paper)]"
                >
                  {block.content as string}
                </h2>
              );
            }
            if (block.type === "h3") {
              return (
                <h3
                  key={i}
                  className="text-base font-semibold mt-6 mb-2 text-[var(--color-gold)]"
                >
                  {block.content as string}
                </h3>
              );
            }
            if (block.type === "ul") {
              return (
                <ul key={i} className="space-y-2 ml-4">
                  {(block.content as string[]).map((item, j) => (
                    <li key={j} className="flex gap-3 text-sm">
                      <span className="text-[var(--color-gold)] mt-1 flex-shrink-0">
                        ▸
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={i} className="text-sm leading-relaxed">
                {block.content as string}
              </p>
            );
          })}
        </div>

        <div className="card rounded-xl p-6 sm:p-8 mt-14 ring-1 ring-[var(--color-gold)]/40">
          <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-3">
            Ready to build?
          </p>
          <h2 className="text-xl font-semibold mb-3">
            Brief a custom AI agent build.
          </h2>
          <p className="text-sm text-[var(--color-paper)]/80 leading-relaxed mb-5">
            $500 Starter or $1,500 Pro. 5–7 day delivery. You own the code.
            Fill the 5-minute brief form and we confirm scope within 24 hours.
          </p>
          <Link
            href="/agents#intake"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] font-medium hover:opacity-90 transition text-sm"
          >
            Start a build →
          </Link>
        </div>
      </article>
    </main>
  );
}
