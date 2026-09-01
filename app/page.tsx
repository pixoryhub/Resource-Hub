import { getResources, getEvents } from "@/lib/data";
import ResourceSection from "@/components/resource-hub/ResourceSection";
import EventsSection from "@/components/resource-hub/EventsSection";

// Resources/events are admin-editable and live in Netlify Blobs (see
// lib/data/content.ts) — that store only exists at request time on
// Netlify's infrastructure, not during `next build`, so this page can't be
// statically prerendered the way it could when the data was static fixtures.
export const dynamic = "force-dynamic";

export default async function ResourceHubPage() {
  const [resources, events] = await Promise.all([getResources(), getEvents()]);
  const communityLinks = resources.filter((r) => r.section === "community-links");
  const educationalResources = resources.filter((r) => r.section === "educational-resources");

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-6 sm:px-6">
      <div>
        <h2 className="headline mb-1.5 text-text">Community Essentials</h2>
        <p className="mb-4 text-sm text-text-muted">Spreadsheets, community info, and FAQs.</p>
        <ResourceSection
          section="community-links"
          initialResources={communityLinks}
          showThumbnail={false}
          columns={1}
        />
      </div>

      <div id="educational-resources">
        <h2 className="headline mb-1.5 text-text">Educational Resources</h2>
        <p className="mb-4 text-sm text-text-muted">Workshops, tutorials, and explainer videos.</p>
        <ResourceSection section="educational-resources" initialResources={educationalResources} />
      </div>

      <div>
        <h2 className="headline mb-1.5 text-text">Upcoming workshops and community calls</h2>
        <p className="mb-4 text-sm text-text-muted">Updated weekly.</p>
        <EventsSection initialEvents={events} />
      </div>
    </div>
  );
}
