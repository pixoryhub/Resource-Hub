"use client";

// The recreation guide a new creator reads inside their track — the
// instructions that used to live in the Notion blueprint. Always shows
// "your next step" (picked from their progress, not the calendar), with the
// pre-start checklist, filming/editing tips, caption keywords and the full
// step list tucked into small collapsible sections so the page stays light.
// Wording comes from the admin-editable guide (see lib/newCreatorTrack.ts).

import { useState, type ReactNode } from "react";
import type { TrackGuide } from "@/lib/data/types";
import { STEP_KEYS, stepKeyFor, type NewCreatorStage } from "@/lib/newCreatorTrack";

function Section({
  title,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  badge?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-bg">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
      >
        <span className="text-xs font-semibold text-text">
          {title}
          {badge && <span className="ml-2 font-bold text-accent">{badge}</span>}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={"shrink-0 text-text-faint transition-transform " + (open ? "" : "-rotate-90")}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && <div className="border-t border-border px-3 py-3">{children}</div>}
    </div>
  );
}

export default function TrackGuideView({
  guide,
  stage,
  totalLinks,
  ticked,
  onToggleChecklist,
}: {
  guide: TrackGuide;
  stage: NewCreatorStage;
  totalLinks: number;
  ticked: string[];
  onToggleChecklist: (item: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const currentKey = stepKeyFor(stage, totalLinks);
  const current = guide.steps[currentKey];
  const currentIndex = STEP_KEYS.indexOf(currentKey);
  const done = guide.checklist.filter((i) => ticked.includes(i)).length;
  const keywords = guide.keywords
    .split(/[,\n]/)
    .map((k) => k.trim())
    .filter(Boolean);

  function copyKeywords() {
    navigator.clipboard
      ?.writeText(keywords.join(", "))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      })
      .catch(() => {
        // clipboard blocked — the keywords are still visible to copy by hand
      });
  }

  return (
    <div className="space-y-2">
      <div className="rounded-xl bg-accent-tint p-3.5">
        <p className="eyebrow mb-1">📖 Your next step</p>
        <p className="text-sm font-bold text-text">{current.title}</p>
        <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-text-muted">{current.body}</p>
      </div>

      <Section
        title="Before you start"
        badge={guide.checklist.length > 0 ? `${done}/${guide.checklist.length}` : undefined}
        defaultOpen={stage === "not-ready" || stage === "ready"}
      >
        <ul className="space-y-1.5">
          {guide.checklist.map((item) => {
            const checked = ticked.includes(item);
            return (
              <li key={item}>
                <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-text">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleChecklist(item)}
                    className="mt-0.5 h-4 w-4 shrink-0"
                  />
                  <span className={checked ? "text-text-faint line-through" : ""}>{item}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="Filming & editing tips">
        <p className="whitespace-pre-line text-xs leading-relaxed text-text-muted">{guide.tips}</p>
      </Section>

      {keywords.length > 0 && (
        <Section title="Caption keywords">
          <p className="mb-2 text-[11px] text-text-faint">Add these to your post captions or comments.</p>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((k) => (
              <span key={k} className="rounded-full bg-border px-2.5 py-1 text-[11px] font-semibold text-text-muted">
                {k}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={copyKeywords}
            className="mt-2.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold text-text-muted hover:border-accent hover:text-accent"
          >
            {copied ? "Copied ✓" : "Copy all"}
          </button>
        </Section>
      )}

      <Section title="All steps">
        <ol className="space-y-2.5">
          {STEP_KEYS.map((key, i) => {
            const step = guide.steps[key];
            const state = i < currentIndex ? "past" : i === currentIndex ? "now" : "later";
            return (
              <li key={key} className={state === "later" ? "opacity-60" : ""}>
                <p className="text-xs font-bold text-text">
                  {state === "past" ? "✓" : state === "now" ? "▶" : "○"} {step.title}
                </p>
                <p className="mt-0.5 whitespace-pre-line pl-4 text-[11px] leading-relaxed text-text-muted">
                  {step.body}
                </p>
              </li>
            );
          })}
        </ol>
      </Section>
    </div>
  );
}
