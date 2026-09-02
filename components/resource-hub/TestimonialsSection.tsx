"use client";

// "A message from our top creators" — short video testimonials under
// Educational Resources. Each entry is a name, a profile link, an average
// earnings figure, and an uploaded video (not a link — see
// lib/videoStore.ts and app/api/admin/videos). Admin add/edit
// follows the same inline-form pattern as Resources/Events.

import { useRef, useState } from "react";
import type { Testimonial } from "@/lib/data/types";
import { useAdminMode } from "@/lib/adminMode";
import { saveContentAction } from "@/lib/adminContentClient";

function TestimonialForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Testimonial;
  onSave: (data: { creatorName: string; profileUrl: string; avgEarnings: string; videoAssetId: string }) => void;
  onCancel: () => void;
}) {
  const [creatorName, setCreatorName] = useState(initial?.creatorName ?? "");
  const [profileUrl, setProfileUrl] = useState(initial?.profileUrl ?? "");
  const [avgEarnings, setAvgEarnings] = useState(initial?.avgEarnings ?? "");
  const [videoAssetId, setVideoAssetId] = useState(initial?.videoAssetId ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/videos", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.ok) {
        setVideoAssetId(data.id);
      } else {
        setError(data.error ?? "Upload failed — try again.");
      }
    } catch {
      setError("Couldn't reach the server — try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleSave() {
    if (!creatorName.trim() || !videoAssetId) return;
    onSave({
      creatorName: creatorName.trim(),
      profileUrl: profileUrl.trim(),
      avgEarnings: avgEarnings.trim(),
      videoAssetId,
    });
  }

  return (
    <div className="card space-y-3 p-5">
      <p className="eyebrow">Creator message</p>
      <input
        type="text"
        value={creatorName}
        onChange={(e) => setCreatorName(e.target.value)}
        placeholder="Creator name"
        className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
        style={{ fontSize: "16px" }}
        autoFocus
      />
      <input
        type="text"
        value={profileUrl}
        onChange={(e) => setProfileUrl(e.target.value)}
        placeholder="Profile link (TikTok, Instagram, etc.)"
        className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
        style={{ fontSize: "16px" }}
      />
      <input
        type="text"
        value={avgEarnings}
        onChange={(e) => setAvgEarnings(e.target.value)}
        placeholder="Average earnings, e.g. $12k/mo"
        className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
        style={{ fontSize: "16px" }}
      />

      <div>
        <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full rounded-xl border border-dashed border-border py-3 text-sm font-semibold text-text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {uploading ? "Uploading…" : videoAssetId ? "✓ Video uploaded — click to replace" : "Choose a video file"}
        </button>
      </div>

      {error && <p className="text-sm text-accent">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!creatorName.trim() || !videoAssetId || uploading}
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

function TestimonialCard({
  testimonial,
  onUpdate,
  onDelete,
}: {
  testimonial: Testimonial;
  onUpdate: (data: { creatorName: string; profileUrl: string; avgEarnings: string; videoAssetId: string }) => void;
  onDelete: () => void;
}) {
  const { enabled: adminMode } = useAdminMode();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (editing) {
    return (
      <TestimonialForm
        initial={testimonial}
        onSave={(data) => {
          onUpdate(data);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="card flex items-center gap-3 overflow-hidden p-3">
      <div className="relative aspect-[9/16] w-24 shrink-0 overflow-hidden rounded-xl bg-black sm:w-28">
        <video
          src={`/api/video/${testimonial.videoAssetId}`}
          controls
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-text">{testimonial.creatorName}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {testimonial.avgEarnings && (
            <span className="rounded-full bg-accent-tint px-2.5 py-1 text-xs font-semibold text-accent">
              {testimonial.avgEarnings}
            </span>
          )}
          {testimonial.profileUrl && (
            <a
              href={testimonial.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-accent hover:underline"
            >
              View profile ↗
            </a>
          )}
        </div>

        {adminMode && (
          <div className="mt-3 flex gap-2 border-t border-border pt-3">
            <button type="button" onClick={() => setEditing(true)} className="text-xs font-semibold text-text-muted hover:text-accent">
              Edit
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="text-xs font-semibold text-text-muted hover:text-accent"
            >
              Delete
            </button>
          </div>
        )}

        {confirmingDelete && (
          <div className="mt-3 rounded-xl bg-accent-tint p-3">
            <p className="text-sm text-text">Delete {testimonial.creatorName}&apos;s message?</p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={onDelete} className="rounded-full bg-text px-4 py-1.5 text-xs font-semibold text-bg">
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

export default function TestimonialsSection({ initial }: { initial: Testimonial[] }) {
  const { enabled: adminMode } = useAdminMode();
  const [testimonials, setTestimonials] = useState(initial);
  const [adding, setAdding] = useState(false);

  function addTestimonial(data: { creatorName: string; profileUrl: string; avgEarnings: string; videoAssetId: string }) {
    const item: Testimonial = { id: `testimonial-${Date.now()}`, position: testimonials.length + 1, ...data };
    setTestimonials((prev) => [...prev, item]);
    setAdding(false);
    saveContentAction("testimonials", { action: "add", item });
  }

  function updateTestimonial(id: string, data: { creatorName: string; profileUrl: string; avgEarnings: string; videoAssetId: string }) {
    setTestimonials((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
    saveContentAction("testimonials", { action: "update", id, patch: data });
  }

  function deleteTestimonial(id: string, videoAssetId: string) {
    setTestimonials((prev) => prev.filter((t) => t.id !== id));
    saveContentAction("testimonials", { action: "delete", id, videoAssetId });
  }

  if (testimonials.length === 0 && !adminMode) return null;

  return (
    <div>
      {testimonials.length === 0 && (
        <p className="mb-3 text-sm text-text-faint">No creator messages yet.</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {testimonials.map((t) => (
          <TestimonialCard
            key={t.id}
            testimonial={t}
            onUpdate={(data) => updateTestimonial(t.id, data)}
            onDelete={() => deleteTestimonial(t.id, t.videoAssetId)}
          />
        ))}
      </div>

      {adminMode && (
        <div className="mt-3">
          {adding ? (
            <TestimonialForm onSave={addTestimonial} onCancel={() => setAdding(false)} />
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="w-full rounded-2xl border border-dashed border-border py-3 text-sm font-semibold text-text-muted transition-colors hover:border-accent hover:text-accent"
            >
              + Add a creator message
            </button>
          )}
        </div>
      )}
    </div>
  );
}
