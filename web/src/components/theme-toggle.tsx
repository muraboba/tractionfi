"use client";

import { useEffect, useRef } from "react";
import { useTheme, type Theme } from "@/lib/theme";

// Lucide-style outline icons, inlined to avoid a runtime dep.
function SunIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setPreference, mounted } = useTheme();
  const announceRef = useRef<HTMLSpanElement | null>(null);
  const lastAnnouncedRef = useRef<Theme | null>(null);

  // Announce theme changes for screen readers, but only after a user-driven
  // change (skip the initial mount sync to avoid spurious announcements).
  useEffect(() => {
    if (!mounted) return;
    if (lastAnnouncedRef.current === null) {
      lastAnnouncedRef.current = theme;
      return;
    }
    if (lastAnnouncedRef.current === theme) return;
    lastAnnouncedRef.current = theme;
    if (announceRef.current) {
      announceRef.current.textContent =
        theme === "light" ? "Light theme enabled." : "Dark theme enabled.";
    }
  }, [theme, mounted]);

  const next: Theme = theme === "dark" ? "light" : "dark";
  const label = `Switch to ${next} theme`;

  return (
    <>
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={() => setPreference(next)}
        className={`inline-flex h-11 w-11 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition-[color,background-color,border-color,transform,opacity] duration-150 hover:border-border-strong hover:bg-surface-2 hover:text-foreground motion-reduce:transition-none ${className}`}
      >
        {/* Render the icon that represents the ACTION (what you'll get on click).
            Dark theme active → show Sun (click → light). Light → show Moon. */}
        {mounted && theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </button>
      <span
        ref={announceRef}
        role="status"
        aria-live="polite"
        className="sr-only"
      />
    </>
  );
}
