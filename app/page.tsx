import { getResources, getEvents } from "@/lib/data";

function formatEventDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ResourceHubPage() {
  const [resources, events] = await Promise.all([getResources(), getEvents()]);
  const guides = resources.filter((r) => r.section === "resources");
  const workshops = resources.filter((r) => r.section === "workshops");

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-8 sm:px-6">
      <div className="rounded-2xl border border-dashed border-border bg-surface p-4 text-sm text-text-muted">
        🔴 This page is reconstructed, not verified — the brief itself says to confirm the full
        resource list with Emma before finalising. Items marked &ldquo;Placeholder&rdquo; below
        are guesses at what belongs here, not the real content.
      </div>

      <div>
        <h2 className="mb-4 text-lg font-bold text-text">Resources</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {guides.map((g) => (
            <a
              key={g.id}
              href={g.url}
              className="card block p-5 transition-colors hover:border-accent"
            >
              <h3 className="font-bold text-text">{g.title}</h3>
              {g.description && <p className="mt-1 text-sm text-text-muted">{g.description}</p>}
            </a>
          ))}
        </div>
      </div>

      <div id="workshops">
        <h2 className="mb-1 text-lg font-bold text-text">Workshops</h2>
        <p className="mb-4 text-sm text-text-muted">
          Educational resources — including the desired-categories explainer linked from every
          Creator Hub video.
        </p>
        <div className="space-y-3">
          {workshops.map((w) => (
            <a
              key={w.id}
              href={w.url}
              className="card block p-5 transition-colors hover:border-accent"
            >
              <h3 className="font-bold text-text">{w.title}</h3>
              {w.description && <p className="mt-1 text-sm text-text-muted">{w.description}</p>}
            </a>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-1 text-lg font-bold text-text">Upcoming workshops and community calls</h2>
        <p className="mb-4 text-sm text-text-muted">Updated weekly.</p>
        <div className="space-y-3">
          {events.map((e) => (
            <div key={e.id} className="card flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold text-text">{e.title}</p>
                <p className="text-sm text-text-muted">{formatEventDate(e.startsAt)}</p>
              </div>
              <a
                href={e.rsvpUrl}
                className="shrink-0 rounded-full border border-border px-4 py-2 text-sm font-semibold text-text transition-colors hover:bg-accent-tint"
              >
                RSVP
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
