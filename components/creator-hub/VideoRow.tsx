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
    <div className="card overflow-hidden">
      <div className="flex items-start gap-3 p-4">
        <button
          type="button"
          onClick={() => onToggleCompleted(video.id)}
          aria-label={completed ? "Mark as unfinished" : "Mark as completed"}
          aria-pressed={completed}
          className={
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors hover:border-accent " +
            (completed ? "accent-gradient border-transparent" : "border-border")
          }
        >
          {completed && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-text-faint">#{video.position}</span>
            <span className="text-text-faint">by {video.creatorName}</span>
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
          <p className={"mt-1 font-semibold text-text " + (completed ? "text-text-muted" : "")}>
            &ldquo;{video.title}&rdquo;
          </p>
        </button>

        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={"mt-1 shrink-0 cursor-pointer text-text-faint transition-transform " + (open ? "" : "-rotate-90")}
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

      {open && (
        <div className="space-y-5 border-t border-border bg-bg p-4 sm:p-5">
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-accent-tint text-accent">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-text-muted">
                Video embedded here — no need to leave the hub to watch it.
              </p>
              <a
                href={video.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-accent hover:underline"
              >
                Open the original ↗
              </a>
            </div>
          </div>

          <div className="rounded-xl bg-accent-tint p-3 text-sm text-text">
            Recreate this format identically to the original. The only things you may swap are
            the hook (for one of the variations below) and the audio (for one of the suggestions
            below).
          </div>

          <div>
            <p className="eyebrow mb-2">Hook variations</p>
            <ul className="space-y-1.5 text-sm text-text">
              {video.hookVariations.map((hook) => (
                <li key={hook} className="rounded-lg border border-border bg-surface px-3 py-2">
                  {hook}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="eyebrow mb-2">Format &amp; emotional layers</p>
              <p className="text-sm text-text-muted">{video.formatLayers}</p>
            </div>
            <div>
              <p className="eyebrow mb-2">Desired category</p>
              <div className="flex items-center gap-2">
                <CategoryChip category={video.desiredCategory} />
                <Link href="/#educational-resources" className="text-xs font-semibold text-accent hover:underline">
                  What does this mean?
                </Link>
              </div>
            </div>
          </div>

          <div>
            <p className="eyebrow mb-2">Visual elements, in order</p>
            <p className="flex flex-wrap items-center gap-1.5 text-sm text-text">
              {video.visualElements.map((el, i) => (
                <span key={el} className="flex items-center gap-1.5">
                  <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-text">
                    {el}
                  </span>
                  {i < video.visualElements.length - 1 && (
                    <span className="text-text-faint">→</span>
                  )}
                </span>
              ))}
            </p>
          </div>

          <div>
            <p className="eyebrow mb-2">Execution notes</p>
            <p className="whitespace-pre-line text-sm text-text-muted">{video.executionNotes}</p>
          </div>

          <div>
            <p className="eyebrow mb-2">Collection-size guidance</p>
            <p className="text-sm text-text-muted">{video.collectionGuidance}</p>
          </div>

          <div>
            <p className="eyebrow mb-2">Audio suggestions</p>
            <ul className="space-y-1.5">
              {video.audioSuggestions.map((a) => (
                <li key={a.label}>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-text hover:border-accent hover:text-accent"
                  >
                    🎵 {a.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
