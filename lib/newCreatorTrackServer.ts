// Server-only: turns a creator's stored new-creator-track record, their
// recreation links, and the audits coaches have ticked off into the summary
// the admin dashboard shows (stage, timestamps, progress). See
// lib/newCreatorTrack.ts for what the track is.

import { loadCreatorDataServer } from "@/lib/creatorData";
import { getSiteSettings } from "@/lib/data/content";
import type { HubVideo } from "@/lib/data/types";
import {
  AUDIT_1_AT,
  AUDIT_2_AT,
  TRACK_RECREATIONS_PER_VIDEO,
  computeStage,
  resolveGuide,
  type NewCreatorAudits,
  type NewCreatorChecklist,
  type NewCreatorTrack,
  type NewCreatorTrackSummary,
} from "@/lib/newCreatorTrack";

type StoredLink = { submittedAt: string };

// The pre-start checklist as it currently stands (coach edits, or the
// built-in default) — read once per request and passed into every summary.
export async function loadChecklistItems(): Promise<string[]> {
  return resolveGuide((await getSiteSettings()).trackGuide).checklist;
}

export async function loadNewCreatorTrackSummary(
  creatorId: string,
  videos: HubVideo[],
  // The current pre-start checklist, so progress counts only items that
  // still exist after a coach edits the list.
  checklistItems: string[]
): Promise<NewCreatorTrackSummary> {
  const [track, audits, links, checklist] = await Promise.all([
    loadCreatorDataServer<NewCreatorTrack | null>("new-creator-track", creatorId, null),
    loadCreatorDataServer<NewCreatorAudits | null>("new-creator-audits", creatorId, null),
    loadCreatorDataServer<Record<string, StoredLink[] | StoredLink>>("recreation-links", creatorId, {}),
    loadCreatorDataServer<NewCreatorChecklist | null>("new-creator-checklist", creatorId, null),
  ]);

  const pickedIds = track?.videoIds ?? [];
  const pickedVideos = pickedIds
    .map((id) => videos.find((v) => v.id === id))
    .filter((v): v is HubVideo => !!v)
    .map((v) => {
      const raw = links[v.id];
      const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
      return { id: v.id, position: v.position, title: v.title, list };
    });

  // Every posted link across the picked videos, oldest first — the 15th and
  // 25th of these are the milestone moments.
  const allTimes = pickedVideos
    .flatMap((v) => v.list.map((l) => l.submittedAt))
    .sort((a, b) => a.localeCompare(b));
  const totalLinks = allTimes.length;
  const auditsDone: NewCreatorAudits = { first: audits?.first ?? null, second: audits?.second ?? null };

  const stage = computeStage({
    readyAt: track?.readyAt ?? null,
    startedAt: track?.startedAt ?? null,
    totalLinks,
    firstAuditDone: !!auditsDone.first,
    secondAuditDone: !!auditsDone.second,
  });
  const ticked = new Set(checklist?.ticked ?? []);

  return {
    stage,
    readyAt: track?.readyAt ?? null,
    startedAt: track?.startedAt ?? null,
    firstLinkAt: allTimes[0] ?? null,
    lastLinkAt: allTimes[allTimes.length - 1] ?? null,
    videos: pickedVideos.map((v) => ({ id: v.id, position: v.position, title: v.title, linkCount: v.list.length })),
    totalLinks,
    targetLinks: pickedVideos.length * TRACK_RECREATIONS_PER_VIDEO,
    milestoneAt: { first: allTimes[AUDIT_1_AT - 1] ?? null, second: allTimes[AUDIT_2_AT - 1] ?? null },
    auditsDone,
    checklist: { done: checklistItems.filter((i) => ticked.has(i)).length, total: checklistItems.length },
  };
}
