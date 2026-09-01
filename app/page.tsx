import { getResources, getEvents } from "@/lib/data";
import ResourceSection from "@/components/resource-hub/ResourceSection";
import EventsSection from "@/components/resource-hub/EventsSection";

export default async function ResourceHubPage() {
  const [resources, events] = await Promise.all([getResources(), getEvents()]);
  const guides = resources.filter((r) => r.section === "resources");
  const workshops = resources.filter((r) => r.section === "workshops");

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-8 sm:px-6">
      <div className="rounded-2xl border border-dashed border-border bg-surface p-4 text-sm text-text-muted">
        🔴 This page is reconstructed, not verified — the brief itself says to confirm the full
        resource list with Emma before finalising. Turn on <strong>Admin mode</strong> (top
        right) to add, edit or remove anything on this page yourself.
      </div>

      <div>
        <h2 className="mb-4 text-lg font-bold text-text">Resources</h2>
        <ResourceSection section="resources" initialResources={guides} />
      </div>

      <div id="workshops">
        <h2 className="mb-1 text-lg font-bold text-text">Workshops</h2>
        <p className="mb-4 text-sm text-text-muted">
          Educational resources — including the desired-categories explainer linked from every
          Creator Hub video.
        </p>
        <ResourceSection section="workshops" initialResources={workshops} />
      </div>

      <div>
        <h2 className="mb-1 text-lg font-bold text-text">Upcoming workshops and community calls</h2>
        <p className="mb-4 text-sm text-text-muted">Updated weekly.</p>
        <EventsSection initialEvents={events} />
      </div>
    </div>
  );
}
