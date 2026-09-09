"use client";

// A soft, low-commitment call-to-action wherever a creator is asked to
// recreate something (the weekly opportunity, a Creator Hub video) — lets
// them drop a link to what they posted so coaches can see it in the admin
// panel. Deliberately vague about what it leads to (raffle entry, a
// challenge, something else) since the program hasn't nailed down the
// mechanic yet — this is just the plumbing to start collecting the links.

import { useState } from "react";

export interface RecreationLink {
  url: string;
  submittedAt: string;
}

export default function RecreationLinkBox({
  value,
  onSubmit,
}: {
  value: RecreationLink | null;
  onSubmit: (url: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value?.url ?? "");

  function handleSubmit() {
    const url = draft.trim();
    if (!url) return;
    onSubmit(url);
    setEditing(false);
  }

  const showForm = !value || editing;

  return (
    <div className="rounded-xl border border-dashed border-accent/40 bg-accent-tint/40 p-4">
      <p className="text-sm font-bold text-text">🎥 Link your recreation</p>
      <p className="mt-0.5 text-xs leading-relaxed text-text-muted">
        Paste the link once it&apos;s posted — you could qualify for a raffle entry or one of our
        upcoming challenges (details coming soon!).
      </p>
      {showForm ? (
        <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="https://..."
            className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
            style={{ fontSize: "16px" }}
          />
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!draft.trim()}
              className="rounded-full bg-text px-4 py-2 text-xs font-semibold text-bg disabled:cursor-not-allowed disabled:opacity-40"
            >
              Submit
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  setDraft(value.url);
                  setEditing(false);
                }}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-text-muted"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className="shrink-0 text-xs font-semibold text-accent">✓ Submitted</span>
          <a
            href={value.url}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 truncate text-sm font-medium text-text hover:underline"
          >
            {value.url}
          </a>
          <button
            type="button"
            onClick={() => {
              setDraft(value.url);
              setEditing(true);
            }}
            className="shrink-0 text-xs font-semibold text-text-muted hover:text-accent"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
