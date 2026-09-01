"use client";

// Fire-and-forget client helper for admin edits to site content
// (resources, events, Creator Hub videos) — see app/api/admin/content and
// lib/data/content.ts. Components keep updating their own local state
// immediately for a snappy UI; this just makes that edit actually survive
// a reload instead of silently reverting.

export function saveContentAction(
  type: "resources" | "events" | "hubVideos",
  body: Record<string, unknown>
): void {
  fetch("/api/admin/content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, ...body }),
  }).catch(() => {
    // network error — the edit stays in local state for this session but
    // won't persist; same failure mode as before this fix, at least visible
    // rather than a silent, delayed revert on the next reload
  });
}
