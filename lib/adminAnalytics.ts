// Shared activity/analytics helpers for the admin dashboard
// (app/api/admin/dashboard, app/api/admin/creators). Turns each creator's
// raw stored data (completions, shot lists, coaching flags) into a common
// "activity event" shape, so weekly bucketing and "last active" only need
// to be written once.

import type { CoachingFlag, Week } from "@/lib/data/types";
import { loadCreatorDataServer } from "@/lib/creatorData";

export interface CompletionEntry {
  videoId: string;
  completedAt: string | null;
}

export interface ActivityEvent {
  type: "completion" | "shot" | "flag";
  at: string; // ISO timestamp
}

export interface CreatorActivity {
  completions: CompletionEntry[];
  filmedShotCount: number;
  flags: CoachingFlag[];
  currentWeek: Week | null;
  archivedWeeks: Week[];
  events: ActivityEvent[]; // only events with a known timestamp
  lastActiveAt: string | null;
}

export async function loadCreatorActivity(creatorId: string): Promise<CreatorActivity> {
  const [completionsRaw, currentWeek, archivedWeeks, flags] = await Promise.all([
    loadCreatorDataServer<Array<string | CompletionEntry>>("completions", creatorId, []),
    loadCreatorDataServer<Week | null>("shotlist-week", creatorId, null),
    loadCreatorDataServer<Week[]>("shotlist-archived", creatorId, []),
    loadCreatorDataServer<CoachingFlag[]>("flags", creatorId, []),
  ]);

  const completions: CompletionEntry[] = completionsRaw.map((item) =>
    typeof item === "string" ? { videoId: item, completedAt: null } : item
  );

  const allWeeks = currentWeek ? [currentWeek, ...archivedWeeks] : archivedWeeks;
  const filmedShots = allWeeks.flatMap((w) => w.shots.filter((s) => s.filmed && s.filmedAt));

  const events: ActivityEvent[] = [
    ...completions.filter((c): c is CompletionEntry & { completedAt: string } => !!c.completedAt).map((c) => ({
      type: "completion" as const,
      at: c.completedAt,
    })),
    ...filmedShots.map((s) => ({ type: "shot" as const, at: s.filmedAt as string })),
    ...flags.map((f) => ({ type: "flag" as const, at: f.submittedAt })),
  ];

  const lastActiveAt = events.reduce<string | null>((max, e) => (!max || e.at > max ? e.at : max), null);

  return {
    completions,
    filmedShotCount: filmedShots.length,
    flags,
    currentWeek,
    archivedWeeks,
    events,
    lastActiveAt,
  };
}

// Monday (UTC) of the week containing the given ISO timestamp — the bucket
// key for the weekly activity chart.
export function mondayOf(iso: string): string {
  const d = new Date(iso);
  const day = d.getUTCDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

// The Monday of `from`'s week, and the (n-1) Mondays before it — oldest first.
export function lastNWeekStarts(n: number, from: Date): string[] {
  const thisWeek = mondayOf(from.toISOString());
  const weeks: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(thisWeek);
    d.setUTCDate(d.getUTCDate() - i * 7);
    weeks.push(d.toISOString().slice(0, 10));
  }
  return weeks;
}
