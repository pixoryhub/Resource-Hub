"use client";

// Challenges lives only here, inside Creator Hub — there is no standalone
// Challenges page/tab. This is a collapsed toggle around the shared content
// in ChallengesBody.tsx, so it doesn't compete with the actual checklist for
// space. If every challenge is deleted/retired, this renders nothing at
// all — that's the "delete the whole section" escape hatch, no separate
// hide toggle needed.

import { useState } from "react";
import type { Challenge, WeeklyOpportunity } from "@/lib/data/types";
import { useAdminMode } from "@/lib/adminMode";
import ChallengesBody from "./ChallengesBody";

export default function CreatorHubChallenges({
  initial,
  weeklyOpportunity,
}: {
  initial: Challenge[];
  weeklyOpportunity: WeeklyOpportunity | null;
}) {
  const { enabled: adminMode } = useAdminMode();
  const [open, setOpen] = useState(false);

  const visible = adminMode ? initial : initial.filter((c) => c.status !== "retired");
  if (visible.length === 0 && !adminMode) return null;

  return (
    <div
      className="overflow-hidden rounded-xl border shadow-sm"
      style={{ borderColor: "var(--accent)", background: "linear-gradient(135deg, var(--accent-tint), var(--surface) 60%)" }}
    >
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 p-3.5 text-left" aria-expanded={open}>
        <span className="flex min-w-0 items-center gap-2.5">
          <span
            className="animate-pulse-glow flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base text-white shadow-sm"
            style={{ background: "linear-gradient(135deg, var(--accent-light), var(--accent))" }}
          >
            🏆
          </span>
          <span className="flex items-center gap-1.5 text-sm font-bold text-text">
            Challenges <span className="font-normal text-text-faint">({visible.length})</span>
          </span>
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={"shrink-0 transition-transform " + (open ? "" : "-rotate-90")}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <div className={"accordion-rows " + (open ? "is-open" : "")}>
        <div>
          <div className="space-y-3 border-t border-border p-3.5 pt-3" inert={!open}>
            <ChallengesBody initial={initial} weeklyOpportunity={weeklyOpportunity} />
          </div>
        </div>
      </div>
    </div>
  );
}
