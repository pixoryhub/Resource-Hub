// The single entry point for all data access — §3.5.
// No component may import lib/data/fixtures or lib/data/supabase directly.
// Switch implementations with DATA_SOURCE=fixtures|supabase in .env.local
// (defaults to fixtures).

import * as fixtures from "./fixtures";
import * as supabase from "./supabase";

export * from "./types";

const source = process.env.DATA_SOURCE === "supabase" ? supabase : fixtures;

export const {
  getCurrentWeek,
  getArchivedWeeks,
  saveWeek,
  getHubVideos,
  getHubVideo,
  submitFlag,
  getFlagsForCreator,
  getAllFlags,
  getResources,
  getEvents,
  getCreator,
} = source;
