"use client";

import { useState } from "react";
import type { Week } from "@/lib/data/types";
import GroupCard from "./GroupCard";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function ArchivedWeekRow({ week }: { week: Week }) {
  const [open, setOpen] = useState(false);
  const filmed = week.shots.filter((s) => s.filmed).length;
  const total = week.shots.length;

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
        aria-expanded={open}
      >
        <div>
          <p className="font-semibold text-text">{week.label}</p>
          <p className="text-sm text-text-muted">
            Archived {week.archivedAt ? formatDate(week.archivedAt) : ""} · {filmed} of {total} shots
            filmed
          </p>
        </div>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={"shrink-0 text-text-faint transition-transform " + (open ? "" : "-rotate-90")}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="space-y-3 border-t border-border bg-bg p-3">
          {week.groups.map((group, i) => (
            <GroupCard
              key={group.id}
              group={group}
              index={i + 1}
              shots={week.shots.filter((s) => s.groupId === group.id)}
              readOnly
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PreviousWeeks({ weeks }: { weeks: Week[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-left text-sm font-semibold text-text-muted underline decoration-dotted underline-offset-2 hover:text-text"
      >
        Previous weeks ({weeks.length})
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {weeks.length === 0 && (
            <p className="text-sm text-text-faint">No archived weeks yet.</p>
          )}
          {weeks.map((week) => (
            <ArchivedWeekRow key={week.id} week={week} />
          ))}
        </div>
      )}
    </div>
  );
}
