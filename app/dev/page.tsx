import Link from "next/link";

// Every route and every state worth looking at, as direct links.
// Grows as checkpoints add states (empty, loading, error, long-content).
const ROUTES: { href: string; label: string; note?: string }[] = [
  { href: "/", label: "Resource Hub" },
  { href: "/creator-hub", label: "Creator Hub" },
  { href: "/coaching-flag", label: "Coaching Flag" },
  { href: "/shot-list-generator", label: "Shot List Generator" },
];

export default function DevIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="eyebrow mb-3">Dev index</p>
      <h1 className="text-3xl font-bold tracking-tight">Every route</h1>
      <p className="mt-3 text-text-muted">
        Direct links to every screen, so review doesn&apos;t mean hunting for
        the page under review. More states (empty, loading, error,
        long-content) get added here as each checkpoint builds them.
      </p>
      <ul className="mt-8 space-y-3">
        {ROUTES.map((route) => (
          <li key={route.href} className="card flex items-center justify-between px-5 py-4">
            <div>
              <Link href={route.href} className="font-semibold text-text hover:text-accent">
                {route.label}
              </Link>
              {route.note && <p className="text-sm text-text-muted">{route.note}</p>}
            </div>
            <code className="text-sm text-text-faint">{route.href}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}
