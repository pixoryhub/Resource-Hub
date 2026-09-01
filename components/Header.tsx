"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAdminMode } from "@/lib/adminMode";
import { useAuth } from "@/lib/localAuth";

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
  const { enabled, ready, login, logout } = useAdminMode();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await login(password);
    setSubmitting(false);
    if (result.ok) {
      setOpen(false);
      setPassword("");
    } else {
      setError(result.error ?? "Incorrect password.");
    }
  }

  if (!ready) return <div className="h-9 w-[124px] shrink-0" aria-hidden />;

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => (enabled ? logout() : setOpen((v) => !v))}
        title={
          enabled
            ? "Turn off admin controls"
            : "Enter the admin password to add, edit or remove content on any page"
        }
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
        {enabled ? "Admin mode: On" : "Admin mode"}
      </button>

      {open && !enabled && (
        <form
          onSubmit={handleSubmit}
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 rounded-2xl border border-border bg-surface p-4 shadow-lg"
        >
          <label className="eyebrow mb-1.5 block">Admin password</label>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-accent"
            style={{ fontSize: "16px" }}
          />
          {error && <p className="mt-1.5 text-xs text-accent">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={submitting || !password}
              className="rounded-full bg-text px-4 py-1.5 text-xs font-semibold text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Checking…" : "Unlock"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError(null);
                setPassword("");
              }}
              className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-text-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function CreatorMenu() {
  const { creator, logOut } = useAuth();
  if (!creator) return null;
  return (
    <button
      type="button"
      onClick={() => {
        if (confirm(`Log out of ${creator.firstName}'s profile on this device?`)) logOut();
      }}
      title="Log out"
      className="shrink-0 rounded-full border border-border px-3 py-2 text-xs font-semibold text-text-muted transition-colors hover:bg-accent-tint hover:text-text"
    >
      Hi, {creator.firstName} · Log out
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
            <CreatorMenu />
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
            <CreatorMenu />
            <AdminToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
