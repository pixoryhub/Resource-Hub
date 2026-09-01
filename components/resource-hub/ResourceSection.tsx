"use client";

import { useState } from "react";
import type { Resource, ResourceLink } from "@/lib/data/types";
import { useAdminMode } from "@/lib/adminMode";
import ResourceCard from "./ResourceCard";
import ResourceForm from "./ResourceForm";

export default function ResourceSection({
  section,
  initialResources,
  columns = 2,
}: {
  section: string;
  initialResources: Resource[];
  columns?: 1 | 2;
}) {
  const { enabled: adminMode } = useAdminMode();
  const [resources, setResources] = useState(initialResources);
  const [adding, setAdding] = useState(false);

  function addResource(data: { title: string; description: string; thumbnailUrl: string; links: ResourceLink[] }) {
    const newResource: Resource = {
      id: `res-${Date.now()}`,
      section,
      position: resources.length + 1,
      ...data,
    };
    setResources((prev) => [...prev, newResource]);
    setAdding(false);
  }

  function updateResource(id: string, data: { title: string; description: string; thumbnailUrl: string; links: ResourceLink[] }) {
    setResources((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
  }

  function deleteResource(id: string) {
    setResources((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div>
      {resources.length === 0 && !adding && (
        <p className="mb-3 text-sm text-text-faint">Nothing here yet.</p>
      )}

      <div className={"grid grid-cols-1 gap-3 " + (columns === 2 ? "sm:grid-cols-2" : "")}>
        {resources.map((r, i) => (
          <ResourceCard
            key={r.id}
            resource={r}
            colourIndex={i}
            onUpdate={(data) => updateResource(r.id, data)}
            onDelete={() => deleteResource(r.id)}
          />
        ))}
      </div>

      {adminMode && (
        <div className="mt-3">
          {adding ? (
            <ResourceForm onSave={addResource} onCancel={() => setAdding(false)} />
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
