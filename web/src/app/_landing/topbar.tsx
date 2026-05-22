"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLockup } from "@/components/brand-lockup";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowRight } from "./icons";

const NAV_ITEMS = [
  { href: "#how", label: "How it works" },
  { href: "#framework", label: "The framework" },
  { href: "#preview", label: "Sample" },
  { href: "#faq", label: "FAQ" },
];

export default function TopBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-[background,border-color,backdrop-filter] duration-200 ${
        scrolled
          ? "bg-background/75 backdrop-blur-md border-b border-border"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-[1024px] items-center justify-between gap-6 px-6">
        <Link href="#top" aria-label="TractionFI home" className="inline-flex items-center">
          <BrandLockup width={144} height={22} className="h-[22px] w-auto" />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href="#preview"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground shadow-[0_0_24px_var(--brand-glow)] transition-colors hover:bg-brand-hover"
          >
            See a sample
            <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </header>
  );
}
