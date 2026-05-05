"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/seo-audit", label: "SEO" },
  { href: "/ads-audit", label: "Ads" },
  { href: "/agents", label: "Agents" },
  { href: "/studio", label: "Studio" },
];

export function Header() {
  const pathname = usePathname();
  return (
    <header className="px-6 sm:px-10 py-5 border-b border-white/5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <Link href="/" className="flex items-baseline gap-2 min-w-0">
          <span className="text-base sm:text-lg tracking-tight font-semibold">
            chappie<span className="text-[--color-gold]">works</span>
          </span>
          <span className="hidden lg:inline text-xs text-[--color-mute] mono">
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
                    ? "text-[--color-gold]"
                    : "hover:text-[--color-gold] focus-visible:text-[--color-gold] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-gold]/40 rounded"
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
