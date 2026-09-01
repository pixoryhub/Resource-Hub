// In-memory fixture data source — §3.5.
// Seeded from fixtures/*.json (added in CP2+) and mutable during a session so
// ticking a box or typing a note actually works on screen. Resets on reload.
//
// CP1 only sets up the shape; there is no seed data to load yet.

import type {
  Creator,
  Week,
  HubVideo,
  CoachingFlag,
  Resource,
  CalendarEvent,
} from "./types";

const state = {
  creators: [] as Creator[],
  weeks: [] as Week[],
  hubVideos: [] as HubVideo[],
  coachingFlags: [] as CoachingFlag[],
  resources: [] as Resource[],
  events: [] as CalendarEvent[],
};

export async function getCurrentWeek(_creatorId: string): Promise<Week | null> {
  return state.weeks.find((w) => w.creatorId === _creatorId && !w.archivedAt) ?? null;
}

export async function getArchivedWeeks(_creatorId: string): Promise<Week[]> {
  return state.weeks.filter((w) => w.creatorId === _creatorId && w.archivedAt);
}

export async function saveWeek(_week: Week): Promise<void> {
  const idx = state.weeks.findIndex((w) => w.id === _week.id);
  if (idx >= 0) state.weeks[idx] = _week;
  else state.weeks.push(_week);
}

export async function getHubVideos(): Promise<HubVideo[]> {
  return state.hubVideos;
}

export async function getHubVideo(id: string): Promise<HubVideo | null> {
  return state.hubVideos.find((v) => v.id === id) ?? null;
}

export async function submitFlag(_flag: CoachingFlag): Promise<void> {
  state.coachingFlags.push(_flag);
}

export async function getFlagsForCreator(creatorId: string): Promise<CoachingFlag[]> {
  return state.coachingFlags.filter((f) => f.creatorId === creatorId);
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
