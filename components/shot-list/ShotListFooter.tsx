"use client";

import { useState } from "react";

export default function ShotListFooter({
  filmed,
  total,
  savedLabel,
  onAddShot,
  onConfirmNewWeek,
}: {
  filmed: number;
  total: number;
  savedLabel: string;
  onAddShot: () => void;
  onConfirmNewWeek: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onAddShot}
        className="w-full rounded-2xl border border-dashed border-border py-3 text-sm font-semibold text-text-muted transition-colors hover:border-accent hover:text-accent sm:w-auto sm:px-6"
      >
        + add a shot
      </button>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-text-muted">
        <span>
          {filmed} of {total} shots filmed
        </span>
        <span>Saved {savedLabel}</span>
      </div>

      <div className="border-t border-border pt-5">
        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-accent-tint"
          >
            Start a new week
          </button>
        ) : (
          <div className="card border-accent/40 bg-accent-tint p-4">
            <p className="font-semibold text-text">
              Archive this week and start fresh? Your filmed progress is saved in Previous weeks.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onConfirmNewWeek();
                  setConfirming(false);
                }}
                className="rounded-full bg-text px-5 py-2 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
              >
                Yes, archive
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-text-muted transition-colors hover:bg-surface"
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
