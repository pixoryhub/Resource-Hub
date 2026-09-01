// Real data source — wired up in CP8. Same function shapes as fixtures.ts.
// No component may import this file directly; go through lib/data/index.ts.
/* eslint-disable @typescript-eslint/no-unused-vars -- params kept for shape parity with fixtures.ts until CP8 */

import type {
  Creator,
  Week,
  HubVideo,
  VideoCompletion,
  CoachingFlag,
  Resource,
  CalendarEvent,
} from "./types";

const NOT_READY = "supabase data source not implemented until CP8";

export async function getCurrentWeek(_creatorId: string): Promise<Week | null> {
  throw new Error(NOT_READY);
}

export async function getArchivedWeeks(_creatorId: string): Promise<Week[]> {
  throw new Error(NOT_READY);
}

export async function saveWeek(_week: Week): Promise<void> {
  throw new Error(NOT_READY);
}

export async function getHubVideos(): Promise<HubVideo[]> {
  throw new Error(NOT_READY);
}

export async function getHubVideo(_id: string): Promise<HubVideo | null> {
  throw new Error(NOT_READY);
}

export async function getVideoCompletions(_creatorId: string): Promise<VideoCompletion[]> {
  throw new Error(NOT_READY);
}

export async function getAllVideoCompletions(): Promise<VideoCompletion[]> {
  throw new Error(NOT_READY);
}

export async function submitFlag(_flag: CoachingFlag): Promise<void> {
  throw new Error(NOT_READY);
}

export async function getFlagsForCreator(_creatorId: string): Promise<CoachingFlag[]> {
  throw new Error(NOT_READY);
}

export async function getAllFlags(): Promise<CoachingFlag[]> {
  throw new Error(NOT_READY);
}

export async function getResources(): Promise<Resource[]> {
  throw new Error(NOT_READY);
}

export async function getEvents(): Promise<CalendarEvent[]> {
  throw new Error(NOT_READY);
}

export async function getCreator(_id: string): Promise<Creator | null> {
  throw new Error(NOT_READY);
}
