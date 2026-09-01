"use client";

import { useState } from "react";
import type { Resource, ResourceLink } from "@/lib/data/types";

export default function ResourceForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Resource;
  onSave: (data: { title: string; description: string; thumbnailUrl: string; links: ResourceLink[] }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnailUrl ?? "");
  const [links, setLinks] = useState<ResourceLink[]>(initial?.links ?? []);
  const [fetchingIndex, setFetchingIndex] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  function updateLink(i: number, patch: Partial<ResourceLink>) {
    setLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function removeLink(i: number) {
    setLinks((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addLink() {
    setLinks((prev) => [...prev, { label: "", url: "" }]);
  }

  async function fetchLinkImage(i: number) {
    const url = links[i]?.url.trim();
    if (!url) return;
    setFetchingIndex(i);
    setFetchError(null);
    try {
      const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (data.image) {
        setThumbnailUrl(data.image);
      } else {
        setFetchError(data.error ?? "No preview image found for that link.");
      }
    } catch {
      setFetchError("Couldn't fetch that link.");
    } finally {
      setFetchingIndex(null);
    }
  }

  function handleSave() {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      thumbnailUrl: thumbnailUrl.trim(),
      links: links.filter((l) => l.label.trim() || l.url.trim()),
    });
  }

  return (
    <div className="card space-y-4 p-5">
      <div>
        <label className="eyebrow mb-1.5 block">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. How to batch create"
          className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
          style={{ fontSize: "16px" }}
          autoFocus
        />
      </div>

      <div>
        <label className="eyebrow mb-1.5 block">Description (optional)</label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A short line about what this is"
          className="w-full resize-y rounded-xl border border-border bg-bg px-3 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
          style={{ fontSize: "16px" }}
        />
      </div>

      <div>
        <label className="eyebrow mb-1.5 block">Links</label>
        <p className="mb-2 text-xs text-text-faint">
          Add as many as you need — a video, a Canva template, a PDF, whatever this resource
          actually is. Use &ldquo;Use as thumbnail&rdquo; to pull that link&apos;s own preview
          image instead of pasting one by hand.
        </p>
        <div className="space-y-2">
          {links.map((link, i) => (
            <div key={i} className="rounded-xl border border-border p-2.5">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => updateLink(i, { label: e.target.value })}
                  placeholder="Label, e.g. Watch video"
                  className="min-w-0 flex-1 rounded-xl border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
                  style={{ fontSize: "16px" }}
                />
                <input
                  type="text"
                  value={link.url}
                  onChange={(e) => updateLink(i, { url: e.target.value })}
                  placeholder="https://..."
                  className="min-w-0 flex-[2] rounded-xl border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
                  style={{ fontSize: "16px" }}
                />
                <button
                  type="button"
                  onClick={() => removeLink(i)}
                  aria-label="Remove link"
                  className="shrink-0 self-start rounded-full px-2 text-lg text-text-faint hover:text-accent sm:self-center"
                >
                  ×
                </button>
              </div>
              <button
                type="button"
                onClick={() => fetchLinkImage(i)}
                disabled={!link.url.trim() || fetchingIndex === i}
                className="mt-1.5 text-xs font-semibold text-accent hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline"
              >
                {fetchingIndex === i ? "Checking that link…" : "📷 Use as thumbnail"}
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addLink}
          className="mt-2 text-xs font-semibold text-accent hover:underline"
        >
          + add another link
        </button>
      </div>

      <div>
        <label className="eyebrow mb-1.5 block">Thumbnail</label>
        {thumbnailUrl ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary external preview image, not a local/optimizable asset */}
            <img src={thumbnailUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => setThumbnailUrl("")}
              className="text-xs font-semibold text-text-muted hover:text-accent"
            >
              Remove
            </button>
          </div>
        ) : (
          <input
            type="text"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="Or paste an image link directly — Canva export, Notion, anywhere public"
            className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
            style={{ fontSize: "16px" }}
          />
        )}
        {fetchError && <p className="mt-1.5 text-xs text-accent">{fetchError}</p>}
      </div>

      <div className="flex gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={!title.trim()}
          className="rounded-full bg-text px-5 py-2 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-text-muted transition-colors hover:bg-surface"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
