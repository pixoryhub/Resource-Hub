"use client";

// A soft, low-commitment call-to-action wherever a creator is asked to
// recreate something (the weekly opportunity, a Creator Hub video) — lets
// them drop links to what they posted so coaches can see it in the admin
// panel. A creator can add as many links here as they like (e.g. more than
// one attempt at the same video). Deliberately vague about what it leads
// to (raffle entry, a challenge, something else) since the program hasn't
// nailed down the mechanic yet — this is just the plumbing to start
// collecting the links.

import { useState } from "react";

export interface RecreationLink {
  url: string;
  submittedAt: string;
}

// Recreation links briefly shipped as a single {url, submittedAt} value per
// item before becoming a list — a few real records were written in that
// old shape before the switchover. Treat anything not already an array as
// "one old-style entry, or none at all" rather than crashing on it.
export function normalizeRecreationLinks(
  raw: RecreationLink[] | RecreationLink | null | undefined
): RecreationLink[] {
  if (Array.isArray(raw)) return raw;
  return raw ? [raw] : [];
}

export default function RecreationLinkBox({
  value,
  onSubmit,
  onRemove,
}: {
  value: RecreationLink[];
  onSubmit: (url: string) => void;
  onRemove: (index: number) => void;
}) {
  const [draft, setDraft] = useState("");
  const [duplicateError, setDuplicateError] = useState(false);

  // A creator can reach the same underlying link list from more than one
  // place (e.g. the weekly opportunity's own page and this same challenge
  // on the Challenges dashboard) — catch a re-paste of a link already on
  // the list here instead of silently double-counting it.
  function handleSubmit() {
    const url = draft.trim();
    if (!url) return;
    if (value.some((l) => l.url.trim() === url)) {
      setDuplicateError(true);
      return;
    }
    setDuplicateError(false);
    onSubmit(url);
    setDraft("");
  }

  return (
    <div className="rounded-xl border border-dashed border-accent/40 bg-accent-tint/40 p-4">
      <p className="text-sm font-bold text-text">🎥 Link your recreations</p>
      <p className="mt-0.5 text-xs leading-relaxed text-text-muted">
        Paste a link each time you post one — you could qualify for a raffle entry or one of our
        upcoming challenges (details coming soon!). Add as many as you like.
      </p>

      {value.length > 0 && (
        <div className="mt-2.5 space-y-1.5">
          {value.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="shrink-0 text-xs font-semibold text-accent">✓</span>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate text-sm font-medium text-text hover:underline"
              >
                {link.url}
              </a>
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label="Remove this link"
                className="shrink-0 rounded-full px-1.5 text-sm leading-none text-text-faint hover:text-accent"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (duplicateError) setDuplicateError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="https://..."
          className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
          style={{ fontSize: "16px" }}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!draft.trim()}
          className="shrink-0 rounded-full bg-text px-4 py-2 text-xs font-semibold text-bg disabled:cursor-not-allowed disabled:opacity-40"
        >
          {value.length > 0 ? "Add another" : "Submit"}
        </button>
      </div>
      {duplicateError && (
        <p className="mt-1.5 text-xs font-semibold text-accent">
          You&apos;ve already linked that one — no need to add it twice.
        </p>
      )}
    </div>
  );
}
