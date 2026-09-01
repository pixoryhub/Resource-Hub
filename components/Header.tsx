"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAdminMode } from "@/lib/adminMode";

// §5 — nav order and verbatim labels are 🟢 confirmed.
const NAV_ITEMS = [
  { label: "Resource Hub", href: "/" },
  { label: "Creator Hub", href: "/creator-hub" },
  { label: "Coaching Flag", href: "/coaching-flag" },
  { label: "Shot List", href: "/shot-list-generator" },
];

// Visibility of the two icons is driven purely by CSS off the
// [data-theme] attribute (see globals.css) — no React state, no
// hydration mismatch with the inline theme script in layout.tsx.
function toggleTheme() {
  const root = document.documentElement;
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  try {
    localStorage.setItem("pixory-theme", next);
  } catch {
    // localStorage unavailable — theme just won't persist across visits
  }
}

function ThemeToggle() {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Switch to dark mode"
      title="Switch to light or dark mode"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-text-muted transition-colors hover:text-text"
    >
      <svg
        className="theme-icon-sun"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg
        className="theme-icon-moon"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
    </button>
  );
}

function AdminToggle() {
  const { enabled, toggle } = useAdminMode();
  return (
    <button
      type="button"
      onClick={toggle}
      title="Preview the admin/coach controls on every page (dev only — real roles arrive with login)"
      className={
        "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors " +
        (enabled
          ? "border-transparent bg-text text-bg"
          : "border-border text-text-muted hover:bg-accent-tint")
      }
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
      Admin mode
    </button>
  );
}

export default function Header() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);

  // Reports its own height as --header-h so other sticky elements (the
  // Shot List Generator's progress card) can pin themselves just below it,
  // regardless of whether the header is one row or stacked on mobile.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const setHeight = () => {
      document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`);
    };
    setHeight();
    const observer = new ResizeObserver(setHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:gap-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight text-text">
            pixory
          </Link>
          <div className="flex items-center gap-2 lg:hidden">
            <AdminToggle />
            <ThemeToggle />
          </div>
        </div>

        <nav className="flex flex-wrap gap-1 lg:order-2 lg:gap-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors " +
                  (active
                    ? "bg-text text-bg"
                    : "text-text-muted hover:bg-accent-tint hover:text-text")
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 lg:order-3 lg:ml-auto">
          <input
            type="search"
            placeholder="Search videos & resources..."
            className="w-full min-w-0 rounded-full border border-border bg-surface px-4 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent lg:w-56"
            style={{ fontSize: "16px" }}
          />
          <div className="hidden items-center gap-2 lg:flex">
            <AdminToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
