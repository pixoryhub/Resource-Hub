"use client";

import { useState } from "react";
import Link from "next/link";
import type { HubVideo } from "@/lib/data/types";
import { useAdminMode } from "@/lib/adminMode";
import CategoryChip from "./CategoryChip";
import HubVideoForm, { type HubVideoFormData } from "./HubVideoForm";

export default function VideoRow({
  video,
  completed,
  onToggleCompleted,
  onUpdate,
  onDelete,
  onMove,
  isFirst,
  isLast,
}: {
  video: HubVideo;
  completed: boolean;
  onToggleCompleted: (videoId: string) => void;
  onUpdate: (data: HubVideoFormData) => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const { enabled: adminMode } = useAdminMode();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (editing) {
    return (
      <HubVideoForm
        initial={video}
        onSave={(data) => {
          onUpdate(data);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="card card-hover overflow-hidden">
      <div className="flex items-center gap-4 p-4 sm:p-5">
        <button
          type="button"
          onClick={() => onToggleCompleted(video.id)}
          aria-label={completed ? "Mark as unfinished" : "Mark as completed"}
          aria-pressed={completed}
          className={
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors hover:border-accent " +
            (completed ? "accent-gradient border-transparent animate-pop" : "border-border")
          }
        >
          {completed && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="min-w-0 flex-1 text-left"
          aria-expanded={open}
        >
          <p className={"headline leading-snug text-text " + (completed ? "text-text-muted" : "")}>
            &ldquo;{video.title}&rdquo;
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-faint">
            <span className="font-semibold">#{video.position}</span>
            <span>by {video.creatorName}</span>
            <CategoryChip category={video.desiredCategory} />
            {video.status === "retired" && (
              <span className="rounded-full bg-border px-2 py-0.5 font-semibold text-text-muted">
                Retired
              </span>
            )}
            {completed && (
              <span className="rounded-full bg-accent-tint px-2 py-0.5 font-semibold text-accent">
                Completed
              </span>
            )}
          </div>
        </button>

        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={"shrink-0 cursor-pointer text-text-faint transition-transform " + (open ? "" : "-rotate-90")}
          onClick={() => setOpen((v) => !v)}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {adminMode && (
        <div className="flex items-center justify-end gap-1 border-t border-border px-4 py-1.5">
          <button type="button" onClick={() => onMove(-1)} disabled={isFirst} aria-label="Move up" className="flex h-8 w-8 items-center justify-center rounded-full text-text-faint hover:text-accent disabled:opacity-30">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 15l6-6 6 6" /></svg>
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={isLast} aria-label="Move down" className="flex h-8 w-8 items-center justify-center rounded-full text-text-faint hover:text-accent disabled:opacity-30">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6" /></svg>
          </button>
          <button type="button" onClick={() => setEditing(true)} aria-label="Edit" className="flex h-8 w-8 items-center justify-center rounded-full text-text-faint hover:text-accent">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
          </button>
          <button type="button" onClick={() => setConfirmingDelete(true)} aria-label="Delete" className="flex h-8 w-8 items-center justify-center rounded-full text-text-faint hover:text-accent">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" /></svg>
          </button>
        </div>
      )}

      {confirmingDelete && (
        <div className="mx-4 mb-4 rounded-xl bg-accent-tint p-3">
          <p className="text-sm text-text">Delete &ldquo;{video.title}&rdquo;?</p>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={onDelete} className="rounded-full bg-text px-4 py-1.5 text-xs font-semibold text-bg">
              Delete
            </button>
            <button type="button" onClick={() => setConfirmingDelete(false)} className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-text-muted">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className={"accordion-rows " + (open ? "is-open" : "")}>
        <div>
        <div className="border-t border-border bg-bg p-4 sm:p-6" inert={!open}>
          {/* Media preview — opens the original until a real embed is wired up */}
          <a
            href={video.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block aspect-video w-full overflow-hidden rounded-2xl bg-surface"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="accent-gradient flex h-14 w-14 items-center justify-center rounded-full text-white shadow-sm transition-transform duration-300 ease-out group-hover:scale-105">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </div>
          </a>
          <div className="mt-2.5 flex items-center justify-between gap-3">
            <p className="text-xs text-text-faint">Embedded here — no need to leave the hub.</p>
            <a
              href={video.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-xs font-semibold text-accent hover:underline"
            >
              Open original ↗
            </a>
          </div>

          <p className="mt-5 rounded-xl bg-accent-tint px-4 py-3 text-sm text-text">
            Recreate this format identically to the original. The only things you may swap are
            the hook and the audio, for one of the options below.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="eyebrow mb-2">Category</p>
              <CategoryChip category={video.desiredCategory} />
              <Link href="/#educational-resources" className="mt-2 block text-xs font-semibold text-accent hover:underline">
                What does this mean?
              </Link>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="eyebrow mb-2">Format &amp; emotion</p>
              <p className="text-sm text-text">{video.formatLayers}</p>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-border bg-surface p-4">
            <p className="eyebrow mb-2">Hook variations</p>
            <ul className="space-y-2 text-sm text-text">
              {video.hookVariations.map((hook) => (
                <li key={hook} className="border-l-2 border-border pl-3 leading-snug">
                  {hook}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-3 rounded-xl border border-border bg-surface p-4">
            <p className="eyebrow mb-2">Visual elements, in order</p>
            <p className="text-sm leading-relaxed text-text">
              {video.visualElements.map((el, i) => (
                <span key={el}>
                  {el}
                  {i < video.visualElements.length - 1 && (
                    <span className="mx-1.5 text-text-faint">→</span>
                  )}
                </span>
              ))}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="eyebrow mb-2">Execution notes</p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-text-muted">
                {video.executionNotes}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="eyebrow mb-2">Collection-size guidance</p>
              <p className="text-sm leading-relaxed text-text-muted">{video.collectionGuidance}</p>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-border bg-surface p-4">
            <p className="eyebrow mb-2">Audio suggestions</p>
            <div className="-mx-1">
              {video.audioSuggestions.map((a) => (
                <a
                  key={a.label}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 rounded-lg px-1 py-1.5 text-sm font-medium text-text transition-colors hover:bg-bg hover:text-accent"
                >
                  <span className="truncate">🎵 {a.label}</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M7 17 17 7M8 7h9v9" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
