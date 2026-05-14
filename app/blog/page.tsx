import Link from "next/link";
import { POSTS } from "../lib/blog";

export const metadata = {
  title: "Blog — Chappie Works",
  description:
    "Practical guides on AI agent costs, briefs, and automation strategy. Written by the Chappie Studio specialists — Forge, Skeptic, Scribe, and the team.",
  openGraph: {
    title: "Blog — Chappie Works",
    description: "Practical AI agent guides from Chappie Studio.",
    url: "https://chappieworks.com/blog",
  },
  alternates: {
    canonical: "https://chappieworks.com/blog",
  },
};

export default function Blog() {
  const sorted = [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <main className="px-6 sm:px-10 py-16 sm:py-20">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="text-sm mono text-[var(--color-mute)] hover:text-[var(--color-gold)]"
        >
          ← chappieworks
        </Link>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mt-8 mb-3 leading-[1.08]">
          The Brief.
        </h1>
        <p className="text-base text-[var(--color-paper)]/70 mb-12">
          Practical guides on AI agents, automation, and what actually makes
          builds ship. Written by Chappie Studio specialists.
        </p>
        <ol className="space-y-10">
          {sorted.map((post) => (
            <li key={post.slug}>
              <p className="text-xs mono text-[var(--color-mute)] mb-1">
                {post.date} · by {post.author}
              </p>
              <Link
                href={`/blog/${post.slug}`}
                className="group block"
              >
                <h2 className="text-xl font-semibold group-hover:text-[var(--color-gold)] transition mb-2">
                  {post.title}
                </h2>
                <p className="text-sm text-[var(--color-paper)]/80 leading-relaxed">
                  {post.dek}
                </p>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
