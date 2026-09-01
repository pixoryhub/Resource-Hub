import Link from "next/link";
import { getResources, getEvents } from "@/lib/data";

const JOURNEY_STEPS = [
  {
    n: 1,
    title: "Recreate from the hub",
    body: "Start here, follow the execution guidance under each video exactly. Lean TOF early to build views and traction.",
  },
  {
    n: 2,
    title: "Recreate from the Blueprint",
    body: "Layer in the fresh weekly opportunities once comfortable. Newest hooks and visuals.",
  },
  {
    n: 3,
    title: "Iterate on your own videos",
    body: "Once you know what works for your account, iterate on your top performers using the iteration guide and the 5-in-5 framework.",
  },
];

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
  const workshops = resources.filter((r) => r.section === "workshops");
  const guides = resources.filter((r) => r.section === "resources");

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-8 sm:px-6">
      <div className="rounded-2xl border border-dashed border-border bg-surface p-4 text-sm text-text-muted">
        🔴 This page is reconstructed, not verified — the brief itself says to confirm the full
        resource list with Emma before finalising. Items marked &ldquo;Placeholder&rdquo; below
        are guesses at what belongs here, not the real content.
      </div>

      <div>
        <p className="eyebrow mb-2">Resource Hub</p>
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
          Everything you need to plan, film and post.
        </h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href="#"
            className="rounded-full bg-text px-5 py-2.5 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
          >
            This week&apos;s Blueprint ↗
          </a>
          <Link
            href="/shot-list-generator"
            className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-accent-tint"
          >
            Shot List Generator
          </Link>
        </div>
      </div>

      <div>
        <h2 className="mb-1 text-lg font-bold text-text">The Creator Content Journey</h2>
        <p className="mb-4 text-sm text-text-muted">Three steps, not buckets — work through them in order.</p>
        <div className="space-y-3">
          {JOURNEY_STEPS.map((step) => (
            <div key={step.n} className="card flex gap-4 p-5">
              <span className="accent-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
                {step.n}
              </span>
              <div>
                <h3 className="font-bold text-text">{step.title}</h3>
                <p className="mt-1 text-sm text-text-muted">{step.body}</p>
              </div>
            </div>
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
              <p className="mt-1 text-sm text-text-muted">{w.description}</p>
            </a>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-1 text-lg font-bold text-text">Resources</h2>
        <p className="mb-4 text-sm text-text-muted">Guides referenced throughout the hub.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {guides.map((g) => (
            <a
              key={g.id}
              href={g.url}
              className="card block p-5 transition-colors hover:border-accent"
            >
              <h3 className="font-bold text-text">{g.title}</h3>
              <p className="mt-1 text-sm text-text-muted">{g.description}</p>
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
