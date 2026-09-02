"use client";

import { useState } from "react";
import type { Resource, ResourceLink } from "@/lib/data/types";

export default function ResourceForm({
  initial,
  showThumbnail = true,
  onSave,
  onCancel,
}: {
  initial?: Resource;
  showThumbnail?: boolean;
  onSave: (data: { title: string; description: string; thumbnailUrl: string; links: ResourceLink[] }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnailUrl ?? "");
  const [links, setLinks] = useState<ResourceLink[]>(initial?.links ?? []);
  const [fetchingIndex, setFetchingIndex] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // Slide exports uploaded together — kept around after picking one so the
  // gallery below stays visible for overriding the auto-picked slide.
  const [uploadedGallery, setUploadedGallery] = useState<string[]>([]);

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

  async function uploadOne(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/images", { method: "POST", body: formData });
    const data = await res.json();
    return data.ok ? (data.url as string) : null;
  }

  // Lets an admin pick their own image — most decks always use the 2nd
  // slide as the thumbnail, so exporting a deck from Canva/Slides (Download
  // → selected/all pages) and dropping every exported file in here at once
  // auto-picks slide 2 with zero extra clicks. The rest of what's uploaded
  // stays visible below so a one-off can still be picked by hand.
  async function uploadThumbnails(files: File[]) {
    if (!files.length) return;
    setUploading(true);
    setUploadError(null);
    try {
      const urls = (await Promise.all(files.map(uploadOne))).filter((u): u is string => !!u);
      if (!urls.length) {
        setUploadError("Couldn't upload those images.");
        return;
      }
      setUploadedGallery(urls);
      // Auto-pick slide 2 when there's a batch; a single file just becomes
      // the thumbnail directly (that's the "paste one screenshot" case).
      setThumbnailUrl(urls.length > 1 ? urls[1] : urls[0]);
      if (urls.length < files.length) {
        setUploadError(`${files.length - urls.length} of ${files.length} images failed to upload.`);
      }
    } catch {
      setUploadError("Couldn't upload those images.");
    } finally {
      setUploading(false);
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
          className="w-full resize-y rounded-xl border border-border bg-bg px-3 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
          style={{ fontSize: "16px" }}
        />
      </div>

      <div>
        <label className="eyebrow mb-1.5 block">Links</label>
        <div className="divide-y divide-border rounded-xl border border-border">
          {links.map((link, i) => (
            <div key={i} className="p-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => updateLink(i, { label: e.target.value })}
                  placeholder="Label, e.g. Watch video"
                  className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
                  style={{ fontSize: "16px" }}
                />
                <input
                  type="text"
                  value={link.url}
                  onChange={(e) => updateLink(i, { url: e.target.value })}
                  placeholder="https://..."
                  className="min-w-0 flex-[2] rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
                  style={{ fontSize: "16px" }}
                />
                <button
                  type="button"
                  onClick={() => removeLink(i)}
                  aria-label="Remove link"
                  className="shrink-0 self-start rounded-full px-2 text-lg leading-none text-text-faint hover:text-accent sm:self-center"
                >
                  ×
                </button>
              </div>
              {showThumbnail && (
                <button
                  type="button"
                  onClick={() => fetchLinkImage(i)}
                  disabled={!link.url.trim() || fetchingIndex === i}
                  className="mt-1.5 text-xs font-semibold text-accent hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline"
                >
                  {fetchingIndex === i ? "Checking…" : "Use as thumbnail"}
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addLink}
            className="block w-full p-3 text-left text-sm font-semibold text-accent hover:bg-bg"
          >
            + Add a link
          </button>
        </div>
      </div>

      {showThumbnail && (
        <div>
          <label className="eyebrow mb-1.5 block">Thumbnail</label>
          {thumbnailUrl ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary external preview image, not a local/optimizable asset */}
              <img src={thumbnailUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => {
                  setThumbnailUrl("");
                  setUploadedGallery([]);
                }}
                className="text-xs font-semibold text-text-muted hover:text-accent"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                onPaste={(e) => {
                  // A screenshot copied to the clipboard (e.g. Cmd+Ctrl+Shift+4
                  // on Mac) pastes as an image, not text — grab it and upload
                  // directly instead of trying to type it into a URL field.
                  const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
                  const file = item?.getAsFile();
                  if (file) {
                    e.preventDefault();
                    uploadThumbnails([file]);
                  }
                }}
                placeholder="Paste an image URL, or paste/drop exported slides"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const files = Array.from(e.dataTransfer.files ?? []).filter((f) => f.type.startsWith("image/"));
                  if (files.length) {
                    e.preventDefault();
                    uploadThumbnails(files);
                  }
                }}
                className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
                style={{ fontSize: "16px" }}
              />
              <div className="flex items-center gap-2">
                <label className="cursor-pointer text-xs font-semibold text-accent hover:underline">
                  {uploading ? "Uploading…" : "Or click to upload exported slides"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    multiple
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      if (files.length) uploadThumbnails(files);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              <p className="text-xs text-text-faint">
                From Canva/Slides: Download → export the deck as images, then drop all the exported files
                in here at once — the 2nd slide gets picked automatically.
              </p>
            </div>
          )}
          {uploadedGallery.length > 1 && (
            <div className="mt-2">
              <p className="mb-1 text-xs font-semibold text-text-muted">
                Uploaded slides — click to use a different one
              </p>
              <div className="flex flex-wrap gap-2">
                {uploadedGallery.map((url, i) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setThumbnailUrl(url)}
                    title={i === 1 ? "Slide 2 (auto-picked)" : `Slide ${i + 1}`}
                    className={
                      "h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 " +
                      (thumbnailUrl === url ? "border-accent" : "border-transparent hover:border-border")
                    }
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail gallery of uploaded images */}
                    <img src={url} alt={`Slide ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
          {fetchError && <p className="mt-1.5 text-xs text-accent">{fetchError}</p>}
          {uploadError && <p className="mt-1.5 text-xs text-accent">{uploadError}</p>}
        </div>
      )}

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
