// In-memory fixture data source — §3.5.
// Seeded from fixtures/*.json and mutable during a session so ticking a box
// or typing a note actually works on screen. Resets on reload.

import type {
  Creator,
  Week,
  HubVideo,
  VideoCompletion,
  CoachingFlag,
  Resource,
  CalendarEvent,
} from "./types";
import goldenWeek from "@/fixtures/golden-week.json";
import archivedWeek1 from "@/fixtures/archived-week-1.json";
import archivedWeek2 from "@/fixtures/archived-week-2.json";
import hubVideos from "@/fixtures/hub-videos.json";
import coachingFlags from "@/fixtures/coaching-flags.json";

const state = {
  creators: [
    {
      id: "creator-1",
      firstName: "Jess",
      lastName: "Freeman",
      role: "creator",
      createdAt: "2026-06-01T09:00:00.000Z",
      lastSeenAt: "2026-08-31T18:00:00.000Z",
    },
  ] as Creator[],
  // The §12 golden case — also the `Example` fixture and the CP11 regression test.
  weeks: [goldenWeek, archivedWeek1, archivedWeek2] as Week[],
  hubVideos: hubVideos as HubVideo[],
  videoCompletions: [
    { creatorId: "creator-1", videoId: "video-1", completedAt: "2026-08-21T10:00:00.000Z" },
    { creatorId: "creator-1", videoId: "video-2", completedAt: "2026-08-23T14:30:00.000Z" },
  ] as VideoCompletion[],
  coachingFlags: coachingFlags as CoachingFlag[],
  resources: [] as Resource[],
  events: [] as CalendarEvent[],
};

export async function getCurrentWeek(_creatorId: string): Promise<Week | null> {
  return state.weeks.find((w) => w.creatorId === _creatorId && !w.archivedAt) ?? null;
}

export async function getArchivedWeeks(_creatorId: string): Promise<Week[]> {
  return state.weeks
    .filter((w) => w.creatorId === _creatorId && w.archivedAt)
    .sort((a, b) => (b.archivedAt ?? "").localeCompare(a.archivedAt ?? ""));
}

export async function saveWeek(_week: Week): Promise<void> {
  const idx = state.weeks.findIndex((w) => w.id === _week.id);
  if (idx >= 0) state.weeks[idx] = _week;
  else state.weeks.push(_week);
}

export async function getHubVideos(): Promise<HubVideo[]> {
  return [...state.hubVideos].sort((a, b) => a.position - b.position);
}

export async function getHubVideo(id: string): Promise<HubVideo | null> {
  return state.hubVideos.find((v) => v.id === id) ?? null;
}

export async function getVideoCompletions(creatorId: string): Promise<VideoCompletion[]> {
  return state.videoCompletions.filter((c) => c.creatorId === creatorId);
}

export async function getAllVideoCompletions(): Promise<VideoCompletion[]> {
  return state.videoCompletions;
}

export async function submitFlag(_flag: CoachingFlag): Promise<void> {
  state.coachingFlags.push(_flag);
}

export async function getFlagsForCreator(creatorId: string): Promise<CoachingFlag[]> {
  return state.coachingFlags
    .filter((f) => f.creatorId === creatorId)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export async function getAllFlags(): Promise<CoachingFlag[]> {
  return state.coachingFlags;
}

export async function getResources(): Promise<Resource[]> {
  return state.resources;
}

export async function getEvents(): Promise<CalendarEvent[]> {
  return state.events;
}

export async function getCreator(id: string): Promise<Creator | null> {
  return state.creators.find((c) => c.id === id) ?? null;
}
