import { getResources, getEvents } from "@/lib/data";
import ResourceSection from "@/components/resource-hub/ResourceSection";
import EventsSection from "@/components/resource-hub/EventsSection";

export default async function ResourceHubPage() {
  const [resources, events] = await Promise.all([getResources(), getEvents()]);
  const communityLinks = resources.filter((r) => r.section === "community-links");
  const educationalResources = resources.filter((r) => r.section === "educational-resources");

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-8 sm:px-6">
      <div className="rounded-2xl border border-dashed border-border bg-surface p-4 text-sm text-text-muted">
        🔴 This page is reconstructed, not verified — the brief itself says to confirm the full
        resource list with Emma before finalising. Turn on <strong>Admin mode</strong> (top
        right) to add, edit or remove anything on this page yourself.
      </div>

      <div>
        <h2 className="mb-1 text-lg font-bold text-text">Community Links</h2>
        <p className="mb-4 text-sm text-text-muted">
          The commission spreadsheet, the Discord server, FAQs — the practical links that don&apos;t
          fit anywhere else. <em>(&ldquo;Community Links&rdquo; is my placeholder name for this
          section — tell me if you want it called something else.)</em>
        </p>
        <ResourceSection section="community-links" initialResources={communityLinks} />
      </div>

      <div id="educational-resources">
        <h2 className="mb-1 text-lg font-bold text-text">Educational Resources</h2>
        <p className="mb-4 text-sm text-text-muted">
          Workshops, Loom explainer videos, and how-to guides — including the desired-categories
          explainer linked from every Creator Hub video.
        </p>
        <ResourceSection section="educational-resources" initialResources={educationalResources} />
      </div>

      <div>
        <h2 className="mb-1 text-lg font-bold text-text">Upcoming workshops and community calls</h2>
        <p className="mb-4 text-sm text-text-muted">Updated weekly.</p>
        <EventsSection initialEvents={events} />
      </div>
    </div>
  );
}
