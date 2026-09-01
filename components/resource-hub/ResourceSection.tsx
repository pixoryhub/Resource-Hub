"use client";

import { useState } from "react";
import type { Resource, ResourceLink } from "@/lib/data/types";
import { useAdminMode } from "@/lib/adminMode";
import { saveContentAction } from "@/lib/adminContentClient";
import ResourceCard from "./ResourceCard";
import ResourceForm from "./ResourceForm";

export default function ResourceSection({
  section,
  initialResources,
  columns = 2,
  showThumbnail = true,
  defaultVisibleCount,
}: {
  section: string;
  initialResources: Resource[];
  columns?: 1 | 2;
  showThumbnail?: boolean;
  // When set, only this many resources show by default, with the rest
  // behind a "Show more" toggle — so a section that keeps growing doesn't
  // keep growing the page itself.
  defaultVisibleCount?: number;
}) {
  const { enabled: adminMode } = useAdminMode();
  const [resources, setResources] = useState(initialResources);
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const hasMore = typeof defaultVisibleCount === "number" && resources.length > defaultVisibleCount;
  const visibleResources = hasMore && !expanded ? resources.slice(0, defaultVisibleCount) : resources;

  function addResource(data: { title: string; description: string; thumbnailUrl: string; links: ResourceLink[] }) {
    const newResource: Resource = {
      id: `res-${Date.now()}`,
      section,
      position: resources.length + 1,
      ...data,
    };
    setResources((prev) => [...prev, newResource]);
    setAdding(false);
    saveContentAction("resources", { action: "add", item: newResource });
  }

  function updateResource(id: string, data: { title: string; description: string; thumbnailUrl: string; links: ResourceLink[] }) {
    setResources((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
    saveContentAction("resources", { action: "update", id, patch: data });
  }

  function deleteResource(id: string) {
    setResources((prev) => prev.filter((r) => r.id !== id));
    saveContentAction("resources", { action: "delete", id });
  }

  return (
    <div>
      {resources.length === 0 && !adding && (
        <p className="mb-3 text-sm text-text-faint">Nothing here yet.</p>
      )}

      <div className={"grid grid-cols-1 gap-3 " + (columns === 2 ? "sm:grid-cols-2" : "")}>
        {visibleResources.map((r, i) => (
          <ResourceCard
            key={r.id}
            resource={r}
            colourIndex={i}
            showThumbnail={showThumbnail}
            onUpdate={(data) => updateResource(r.id, data)}
            onDelete={() => deleteResource(r.id)}
          />
        ))}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-sm font-semibold text-text-muted underline decoration-dotted underline-offset-2 hover:text-text"
        >
          {expanded ? "Show less" : `Show more (${resources.length - defaultVisibleCount!})`}
        </button>
      )}

      {adminMode && (
        <div className="mt-3">
          {adding ? (
            <ResourceForm
              showThumbnail={showThumbnail}
              onSave={addResource}
              onCancel={() => setAdding(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="w-full rounded-2xl border border-dashed border-border py-3 text-sm font-semibold text-text-muted transition-colors hover:border-accent hover:text-accent"
            >
              + Add to this section
            </button>
          )}
        </div>
      )}
    </div>
  );
}
