"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/seo-audit", label: "SEO" },
  { href: "/ads-audit", label: "Ads" },
  { href: "/agents", label: "Agents" },
  { href: "/blog", label: "Blog" },
  { href: "/studio", label: "Studio" },
  { href: "/shop", label: "Shop" },
];

export function Header() {
  const pathname = usePathname();
  return (
    <header className="px-6 sm:px-10 py-5 border-b border-white/5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <Image
            src="/chappieworks-logo.png"
            alt="Chappie Works logo"
            width={32}
            height={32}
            priority
            className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
          />
          <span className="text-base sm:text-lg tracking-tight font-semibold">
            chappie<span className="text-[var(--color-gold)]">works</span>
          </span>
          <span className="hidden lg:inline text-xs text-[var(--color-mute)] mono ml-1">
            productized AI work
          </span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-5 text-sm">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "text-[var(--color-gold)]"
                    : "hover:text-[var(--color-gold)] focus-visible:text-[var(--color-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]/40 rounded"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
