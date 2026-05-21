import Link from "next/link";

export function Footer() {
  return (
    <footer className="px-6 sm:px-10 py-12 border-t border-white/5 text-sm text-[var(--color-mute)]">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <span className="mono text-xs">
          chappieworks · by{" "}
          <a
            href="https://chappiethebot.com"
            className="hover:text-[var(--color-gold)]"
          >
            chappie the bot
          </a>
        </span>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link className="hover:text-[var(--color-gold)]" href="/coin">
            $chappie
          </Link>
          <Link className="hover:text-[var(--color-gold)]" href="/agents">
            agents
          </Link>
          <Link className="hover:text-[var(--color-gold)]" href="/website">
            website
          </Link>
          <Link className="hover:text-[var(--color-gold)]" href="/movie">
            movie
          </Link>
          <Link className="hover:text-[var(--color-gold)]" href="/photoshoot">
            visuals
          </Link>
          <Link className="hover:text-[var(--color-gold)]" href="/ads-audit">
            ads
          </Link>
          <Link className="hover:text-[var(--color-gold)]" href="/brief/ai-agency">
            brief
          </Link>
          <Link className="hover:text-[var(--color-gold)]" href="/blog">
            blog
          </Link>
          <Link className="hover:text-[var(--color-gold)]" href="/studio">
            studio
          </Link>
          <Link className="hover:text-[var(--color-gold)]" href="/shop">
            shop
          </Link>
          <Link className="hover:text-[var(--color-gold)]" href="/privacy">
            privacy
          </Link>
          <Link className="hover:text-[var(--color-gold)]" href="/terms">
            terms
          </Link>
          <a
            className="hover:text-[var(--color-gold)]"
            href="https://chappiethebot.com"
          >
            ↗ chappiethebot
          </a>
        </nav>
      </div>
    </footer>
  );
}
