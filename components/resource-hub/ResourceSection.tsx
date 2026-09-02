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
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

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

  // Reordering only ever happens among the currently-visible resources — if
  // something's tucked behind "Show more", expand the section first to drag
  // it. Dropping `draggedId` where `targetId` was reassigns everyone's
  // position to match the new visual order, then persists all of it in one
  // reorder call.
  function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    setResources((prev) => {
      const fromIndex = prev.findIndex((r) => r.id === draggedId);
      const toIndex = prev.findIndex((r) => r.id === targetId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      const withPositions = next.map((r, i) => ({ ...r, position: i + 1 }));
      saveContentAction("resources", {
        action: "reorder",
        positions: withPositions.map((r) => ({ id: r.id, position: r.position })),
      });
      return withPositions;
    });
    setDraggedId(null);
    setDragOverId(null);
  }

  return (
    <div>
      {resources.length === 0 && !adding && (
        <p className="mb-3 text-sm text-text-faint">Nothing here yet.</p>
      )}

      <div className={"grid grid-cols-1 gap-3 " + (columns === 2 ? "sm:grid-cols-2" : "")}>
        {visibleResources.map((r, i) => (
          <div
            key={r.id}
            draggable={adminMode}
            onDragStart={(e) => {
              setDraggedId(r.id);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
              if (!draggedId) return;
              e.preventDefault();
              if (dragOverId !== r.id) setDragOverId(r.id);
            }}
            onDragLeave={() => {
              if (dragOverId === r.id) setDragOverId(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(r.id);
            }}
            onDragEnd={() => {
              setDraggedId(null);
              setDragOverId(null);
            }}
            className={
              "relative transition-[opacity,box-shadow] " +
              (adminMode ? "cursor-grab active:cursor-grabbing " : "") +
              (draggedId === r.id ? "opacity-40 " : "") +
              (dragOverId === r.id && draggedId !== r.id ? "rounded-[20px] ring-2 ring-accent" : "")
            }
          >
            {adminMode && (
              <span
                className="absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-surface/90 text-text-faint shadow-sm backdrop-blur"
                aria-hidden
                title="Drag to reorder"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="8" cy="6" r="1.6" />
                  <circle cx="16" cy="6" r="1.6" />
                  <circle cx="8" cy="12" r="1.6" />
                  <circle cx="16" cy="12" r="1.6" />
                  <circle cx="8" cy="18" r="1.6" />
                  <circle cx="16" cy="18" r="1.6" />
                </svg>
              </span>
            )}
            <ResourceCard
              resource={r}
              colourIndex={i}
              showThumbnail={showThumbnail}
              onUpdate={(data) => updateResource(r.id, data)}
              onDelete={() => deleteResource(r.id)}
            />
          </div>
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
