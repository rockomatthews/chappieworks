"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV = [
  { href: "/coin", label: "$CHAPPIE" },
  { href: "/agents", label: "Agents" },
  { href: "/website", label: "Website" },
  { href: "/movie", label: "Movie" },
  { href: "/photoshoot", label: "Visuals" },
  { href: "/ads-audit", label: "Ads" },
  { href: "/brief/ai-agency", label: "Brief" },
  { href: "/blog", label: "Blog" },
  { href: "/studio", label: "Studio" },
  { href: "/shop", label: "Shop" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="border-b border-white/5 relative z-50">
      <div className="px-6 sm:px-10 py-5 max-w-6xl mx-auto flex items-center justify-between gap-4">
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

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-5 text-sm">
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

        {/* Hamburger button — mobile only */}
        <button
          className="sm:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          <span
            className={`block w-5 h-px bg-[var(--color-paper)] transition-all duration-200 origin-center ${
              open ? "rotate-45 translate-y-[7px]" : ""
            }`}
          />
          <span
            className={`block w-5 h-px bg-[var(--color-paper)] transition-all duration-200 ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-5 h-px bg-[var(--color-paper)] transition-all duration-200 origin-center ${
              open ? "-rotate-45 -translate-y-[7px]" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="sm:hidden border-t border-white/5 bg-[var(--color-ink)] px-6 py-4 flex flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`py-3 text-base border-b border-white/5 last:border-0 ${
                  active
                    ? "text-[var(--color-gold)]"
                    : "text-[var(--color-paper)]/80 hover:text-[var(--color-gold)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
