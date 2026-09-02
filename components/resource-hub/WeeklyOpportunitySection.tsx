"use client";

// The weekly high-impact opportunity spotlight — deliberately NOT a card
// like everything else on this page, and not tucked into a tab. It's the
// first thing rendered on the Resource Hub, styled to look urgent (dark
// gradient, pulsing badge) so it can't blend into the rest of the page the
// way a Discord message scrolls out of sight.
//
// Editing is one title field + one big paste box, not a form per section —
// the body auto-detects bare URLs (rendered as "Watch" buttons) and short
// ALL-CAPS/emoji lines (rendered as section headers), so pasting roughly
// what the team already writes for Discord is enough. See
// lib/data/types.ts's WeeklyOpportunity for the stored shape.

import { useRef, useState } from "react";
import type { WeeklyOpportunity } from "@/lib/data/types";
import { useAdminMode } from "@/lib/adminMode";
import { saveContentAction } from "@/lib/adminContentClient";

function isUrlLine(line: string): boolean {
  return /^https?:\/\/\S+$/.test(line);
}

// A short line that's essentially all caps once emoji/punctuation are
// stripped out — "🔥 HOOKS", "WHY THIS IS WORKING SO WELL", "SOLO:" — reads
// as a section header the way the team already writes them.
function isHeaderLine(line: string): boolean {
  if (line.length > 46) return false;
  const letters = line.replace(/[^\p{L}]/gu, "");
  return letters.length > 0 && letters === letters.toUpperCase() && letters !== letters.toLowerCase();
}

function daysAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  return `Posted ${days}d ago`;
}

function OpportunityBody({ lines }: { lines: string[] }) {
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (isUrlLine(line)) {
          return (
            <a
              key={i}
              href={line}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-accent shadow-sm transition-transform hover:scale-105"
            >
              Watch ↗
            </a>
          );
        }
        if (isHeaderLine(line)) {
          return (
            <p key={i} className="mt-5 text-xs font-bold uppercase tracking-widest text-white/80 first:mt-0">
              {line}
            </p>
          );
        }
        return (
          <p key={i} className="text-[15px] leading-snug text-white">
            {line}
          </p>
        );
      })}
    </div>
  );
}

function OpportunityForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: WeeklyOpportunity | null;
  onSave: (value: WeeklyOpportunity) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [videoAssetId, setVideoAssetId] = useState(initial?.videoAssetId ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/videos", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.ok) {
        setVideoAssetId(data.id);
      } else {
        setUploadError(data.error ?? "Upload failed — try again.");
      }
    } catch {
      setUploadError("Couldn't reach the server — try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleSave() {
    if (!title.trim() || !body.trim()) return;
    onSave({
      title: title.trim(),
      body: body.trim(),
      active,
      updatedAt: new Date().toISOString(),
      videoAssetId: videoAssetId || undefined,
    });
  }

  return (
    <div className="card space-y-3 p-5">
      <p className="eyebrow">This week&apos;s opportunity</p>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="🚨 5 MIO+ RECIPE &quot;HOW RICH ARE YOU?&quot;"
        className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
        style={{ fontSize: "16px" }}
        autoFocus
      />
      <textarea
        rows={14}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={
          "Paste roughly what you'd post to Discord — line by line is fine.\n\nBare links (one per line) become “Watch” buttons.\nShort ALL-CAPS/emoji lines (like “🔥 HOOKS”) become section headers.\nEverything else just renders as text, in the order you paste it."
        }
        className="w-full resize-y rounded-xl border border-border bg-bg px-3 py-2.5 font-mono text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
        style={{ fontSize: "16px" }}
      />
      <div>
        <label className="eyebrow mb-1.5 block">Reference video (optional)</label>
        <p className="mb-2 text-xs text-text-faint">
          For when you don&apos;t have a link to point at — upload the clip itself instead.
        </p>
        <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-xl border border-dashed border-border px-4 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
          >
            {uploading ? "Uploading…" : videoAssetId ? "✓ Video uploaded — click to replace" : "Choose a video file"}
          </button>
          {videoAssetId && (
            <button
              type="button"
              onClick={() => setVideoAssetId("")}
              className="text-xs font-semibold text-text-faint hover:text-accent"
            >
              Remove
            </button>
          )}
        </div>
        {uploadError && <p className="mt-1.5 text-sm text-accent">{uploadError}</p>}
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-text">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4" />
        Live on the Resource Hub
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!title.trim() || !body.trim()}
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

export default function WeeklyOpportunitySection({ initial }: { initial: WeeklyOpportunity | null }) {
  const { enabled: adminMode } = useAdminMode();
  const [opportunity, setOpportunity] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);

  function handleSave(value: WeeklyOpportunity) {
    setOpportunity(value);
    setEditing(false);
    saveContentAction("weeklyOpportunity", { action: "save", value });
  }

  if (editing) {
    return <OpportunityForm initial={opportunity} onSave={handleSave} onCancel={() => setEditing(false)} />;
  }

  if (!opportunity || !opportunity.active) {
    if (!adminMode) return null;
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="w-full rounded-2xl border border-dashed border-border py-6 text-sm font-semibold text-text-muted transition-colors hover:border-accent hover:text-accent"
      >
        + Add this week&apos;s high-impact opportunity
      </button>
    );
  }

  const lines = opportunity.body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const [teaserLine, ...restLines] = lines;

  return (
    <div
      className="relative overflow-hidden rounded-[24px] p-6 shadow-lg sm:p-7"
      style={{ background: "linear-gradient(135deg, var(--accent) 0%, #b8306f 100%)" }}
    >
      {adminMode && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition-colors hover:bg-white/30"
          aria-label="Edit this week's opportunity"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>
      )}

      <button type="button" onClick={() => setOpen((v) => !v)} className="block w-full text-left" aria-expanded={open}>
        <span className="animate-pulse-slow inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent">
          🚨 This week&apos;s opportunity
        </span>

        <h2 className="mt-3 pr-8 text-xl font-extrabold leading-tight text-white sm:text-2xl">{opportunity.title}</h2>
        <p className="mt-1 text-xs font-semibold text-white/70">{daysAgo(opportunity.updatedAt)}</p>

        {teaserLine && <p className="mt-4 text-[15px] font-semibold leading-snug text-white">{teaserLine}</p>}

        <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-white/80">
          {open ? "Show less" : "Show more"}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={"transition-transform " + (open ? "rotate-180" : "")}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>

      {(restLines.length > 0 || opportunity.videoAssetId) && (
        <div className={"accordion-rows " + (open ? "is-open" : "")}>
          <div>
            <div className="mt-4 border-t border-white/20 pt-4" inert={!open}>
              {opportunity.videoAssetId && (
                <video
                  src={`/api/video/${opportunity.videoAssetId}`}
                  controls
                  playsInline
                  preload="metadata"
                  className="mb-4 max-h-[420px] w-full rounded-2xl bg-black"
                />
              )}
              <OpportunityBody lines={restLines} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
