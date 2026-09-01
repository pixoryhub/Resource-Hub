// The single entry point for all data access — §3.5.
// No component may import lib/data/fixtures, lib/data/supabase, or
// lib/data/content directly. Switch implementations with
// DATA_SOURCE=fixtures|supabase in .env.local (defaults to fixtures).

import * as fixtures from "./fixtures";
import * as supabase from "./supabase";
import * as content from "./content";

export * from "./types";

const source = process.env.DATA_SOURCE === "supabase" ? supabase : fixtures;

export const {
  getCurrentWeek,
  getArchivedWeeks,
  saveWeek,
  getHubVideo,
  getVideoCompletions,
  getAllVideoCompletions,
  submitFlag,
  getFlagsForCreator,
  getAllFlags,
  getCreator,
} = source;

// Resources, events, and Creator Hub videos go through the Blobs-backed
// content layer instead of `source` directly — that's what makes admin
// edits to them actually survive a reload (see lib/data/content.ts).
export const { getResources, getEvents, getHubVideos, getWeeklyOpportunity } = content;
