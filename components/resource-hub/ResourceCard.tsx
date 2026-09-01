"use client";

import { useState } from "react";
import type { Resource, ResourceLink } from "@/lib/data/types";
import { useAdminMode } from "@/lib/adminMode";
import ResourceThumbnail from "./ResourceThumbnail";
import ResourceForm from "./ResourceForm";

export default function ResourceCard({
  resource,
  colourIndex,
  onUpdate,
  onDelete,
}: {
  resource: Resource;
  colourIndex: number;
  onUpdate: (data: { title: string; description: string; thumbnailUrl: string; links: ResourceLink[] }) => void;
  onDelete: () => void;
}) {
  const { enabled: adminMode } = useAdminMode();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (editing) {
    return (
      <ResourceForm
        initial={resource}
        onSave={(data) => {
          onUpdate(data);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="card group relative overflow-hidden">
      {adminMode && (
        <div className="absolute right-2 top-2 z-10 flex gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-text shadow-sm backdrop-blur hover:text-accent"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            aria-label="Delete"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-text shadow-sm backdrop-blur hover:text-accent"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
            </svg>
          </button>
        </div>
      )}

      <ResourceThumbnail thumbnailUrl={resource.thumbnailUrl} title={resource.title} colourIndex={colourIndex} />

      <div className="p-5">
        <h3 className="font-bold text-text">{resource.title}</h3>
        {resource.description && (
          <p className="mt-1 text-sm text-text-muted">{resource.description}</p>
        )}
        {resource.links.length > 0 && (
          <div className="mt-3 -mx-1 border-t border-border pt-1">
            {resource.links.map((link, i) => (
              <a
                key={i}
                href={link.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 rounded-lg px-1 py-1.5 text-sm font-medium text-text transition-colors hover:bg-bg hover:text-accent"
              >
                <span className="truncate">{link.label || link.url}</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M7 17 17 7M8 7h9v9" />
                </svg>
              </a>
            ))}
          </div>
        )}

        {confirmingDelete && (
          <div className="mt-3 rounded-xl bg-accent-tint p-3">
            <p className="text-sm text-text">Delete &ldquo;{resource.title}&rdquo;?</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={onDelete}
                className="rounded-full bg-text px-4 py-1.5 text-xs font-semibold text-bg"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-text-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
