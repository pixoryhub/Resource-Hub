// Site content (resources, calendar events, Creator Hub videos) — Blobs-
// backed so admin edits actually persist. lib/data/fixtures.ts holds this
// in a plain in-memory object that "resets on reload" (its own comment) —
// fine for local dev, but a real problem in production, where every
// serverless invocation can be a fresh instance anyway. This module reads
// from Blobs instead, seeding once from the fixtures the first time it's
// ever asked for each content type.

import { getBlobStore } from "@/lib/serverStore";
import * as fixtures from "./fixtures";
import type { Resource, CalendarEvent, HubVideo, WeeklyOpportunity, Testimonial, TopPost, SiteSettings, Challenge, TrackMix, TrackGuide, TrackStepKey } from "./types";

const noSeed = async () => [];

// Seeded once, directly here rather than from a fixtures/*.json file —
// this is the real starting content from the brief, not sample data, so
// there's nothing to keep in sync with a separate fixture asset.
async function seedChallenges(): Promise<Challenge[]> {
  const now = new Date().toISOString();
  return [
    {
      id: "challenge-raffle",
      kind: "raffle",
      position: 1,
      title: "Ongoing Execution Raffle",
      description:
        "Recreate the high-impact opportunity, mark it done, and link your post — 1 entry, every week it's live.",
      prizeText: "Cash bonus or physical item",
      prizeImageUrl: "",
      criteria: [],
      rules:
        "Earn 1 entry per week — mark it done AND link your post, or it won't count.\nVideo must be an exact recreation — same text hook, visual, and format.\nRaffle resets every 2 weeks.\nPrizes vary each cycle — cash bonuses or physical items.",
      cycleStart: "2026-09-15",
      cycleEnd: "2026-09-28",
      status: "active",
      comingSoonMessage: "",
      updatedAt: now,
    },
    {
      id: "challenge-spotlight",
      kind: "spotlight",
      position: 2,
      title: "Creator of the Week",
      description:
        "One creator, picked by the coaches for real effort — hub activity, posting consistency, and being active in the community and Discord.",
      prizeText: "$150 cash",
      prizeImageUrl: "",
      criteria: [],
      rules:
        "Weighted across hub activity, posting consistency, and community engagement.\nBeing active in Discord counts, not just what you post.\nCoaches choose the winner directly — there's no public leaderboard for this one.\nAnnounced alongside the raffle winner every 2 weeks.",
      cycleStart: "2026-09-15",
      cycleEnd: "2026-09-28",
      status: "active",
      comingSoonMessage: "",
      updatedAt: now,
    },
    {
      id: "challenge-featured-1",
      kind: "featured",
      position: 3,
      title: "Bestie-Goals Challenge",
      description:
        'Post your own spin on the "bestie goals" format. Only videos that meet every criterion below count.',
      prizeText: "Ring light + $75",
      prizeImageUrl: "",
      criteria: [
        'Uses the "bestie goals" hook or a close variation',
        "Posted between Sep 15 – Sep 28",
        "Tags @pixory or uses #pixorybesties",
      ],
      rules:
        "Entries are checked manually — coaches review each linked video against the criteria above.\nYou can link more than one attempt; only one needs to qualify.\nDuets and stitches of someone else's bestie-goals video don't count — it has to be your own recreation.\nWinner is announced in Discord within 48 hours of the cycle ending.",
      cycleStart: "2026-09-15",
      cycleEnd: "2026-09-28",
      status: "active",
      comingSoonMessage: "",
      updatedAt: now,
    },
  ];
}

const CONTENT_STORE = "pixory-site-content";
const WEEKLY_OPPORTUNITY_KEY = "weekly-opportunity";
const SITE_SETTINGS_KEY = "site-settings";

async function getList<T>(key: string, seed: () => Promise<T[]>): Promise<T[]> {
  const store = getBlobStore(CONTENT_STORE);
  let raw: string | null;
  try {
    raw = await store.get(key, { type: "text" });
  } catch {
    // Blobs unavailable (e.g. local `next dev` without Netlify context) —
    // fall back to the fixtures so the site still renders something,
    // without trying (and failing) to write the seed back.
    return seed();
  }
  if (raw) {
    // A key can end up holding a shape from before it was a list — that
    // literally happened when "top-posts" changed from a singleton object
    // to a list under the same key. Treat anything non-array as "start
    // fresh" instead of crashing every page that reads it.
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as T[];
  }

  const seeded = await seed();
  try {
    await store.set(key, JSON.stringify(seeded));
  } catch {
    // ignore — worst case it just reseeds again next request
  }
  return seeded;
}

// Read-modify-write on a list isn't safe when two admin actions land close
// together (two uploads, or an edit landing mid-add) — the second write's
// "read" can be stale, silently discarding the first write (a lost
// update). This showed up for real: a testimonial added via script and one
// edited via the UI seconds apart made one of them vanish.
//
// Netlify Blobs supports compare-and-swap via ETags (`onlyIfMatch` on an
// existing key, `onlyIfNew` when creating one) — `set()` reports back
// `modified: false` instead of throwing when the condition fails, so this
// retries with a fresh read until its write actually lands.
async function mutateList<T>(
  key: string,
  seed: () => Promise<T[]>,
  mutate: (list: T[]) => T[]
): Promise<T[]> {
  const store = getBlobStore(CONTENT_STORE);
  for (let attempt = 0; attempt < 8; attempt++) {
    const current = (await store.getWithMetadata(key, { type: "json" })) as { data: T[]; etag: string } | null;
    const list = current ? current.data : await seed();
    const next = mutate(list);
    const result = await store.set(
      key,
      JSON.stringify(next),
      current ? { onlyIfMatch: current.etag } : { onlyIfNew: true }
    );
    if (result.modified) return next;
    // Someone else wrote in between — retry against the now-current value.
  }
  throw new Error(`Too many conflicting writes to "${key}".`);
}

async function addItem<T extends { id: string }>(key: string, seed: () => Promise<T[]>, item: T): Promise<void> {
  await mutateList(key, seed, (list) => [...list, item]);
}

async function updateItem<T extends { id: string }>(
  key: string,
  seed: () => Promise<T[]>,
  id: string,
  patch: Partial<T>
): Promise<T[]> {
  return mutateList(key, seed, (list) => list.map((x) => (x.id === id ? { ...x, ...patch } : x)));
}

async function deleteItem<T extends { id: string }>(key: string, seed: () => Promise<T[]>, id: string): Promise<T[]> {
  return mutateList(key, seed, (list) => list.filter((x) => x.id !== id));
}

async function setPositions<T extends { id: string; position: number }>(
  key: string,
  seed: () => Promise<T[]>,
  updates: { id: string; position: number }[]
): Promise<T[]> {
  const positionById = new Map(updates.map((u) => [u.id, u.position]));
  return mutateList<T>(key, seed, (list) =>
    list.map((x) => (positionById.has(x.id) ? { ...x, position: positionById.get(x.id)! } : x))
  );
}

// Resources ------------------------------------------------------------

export function getResources(): Promise<Resource[]> {
  return getList<Resource>("resources", fixtures.getResources);
}
export function addResource(item: Resource): Promise<void> {
  return addItem("resources", fixtures.getResources, item);
}
export function updateResource(id: string, patch: Partial<Resource>): Promise<Resource[]> {
  return updateItem<Resource>("resources", fixtures.getResources, id, patch);
}
export function deleteResource(id: string): Promise<Resource[]> {
  return deleteItem<Resource>("resources", fixtures.getResources, id);
}
export function setResourcePositions(updates: { id: string; position: number }[]): Promise<Resource[]> {
  return setPositions<Resource>("resources", fixtures.getResources, updates);
}

// Calendar events --------------------------------------------------------

export function getEvents(): Promise<CalendarEvent[]> {
  return getList<CalendarEvent>("events", fixtures.getEvents);
}
export function addEvent(item: CalendarEvent): Promise<void> {
  return addItem("events", fixtures.getEvents, item);
}
export function updateEvent(id: string, patch: Partial<CalendarEvent>): Promise<CalendarEvent[]> {
  return updateItem<CalendarEvent>("events", fixtures.getEvents, id, patch);
}
export function deleteEvent(id: string): Promise<CalendarEvent[]> {
  return deleteItem<CalendarEvent>("events", fixtures.getEvents, id);
}

// Creator Hub videos -------------------------------------------------------

export function getHubVideos(): Promise<HubVideo[]> {
  return getList<HubVideo>("hub-videos", fixtures.getHubVideos);
}
export function addHubVideo(item: HubVideo): Promise<void> {
  return addItem("hub-videos", fixtures.getHubVideos, item);
}
export function updateHubVideo(id: string, patch: Partial<HubVideo>): Promise<HubVideo[]> {
  return updateItem<HubVideo>("hub-videos", fixtures.getHubVideos, id, patch);
}
export function deleteHubVideo(id: string): Promise<HubVideo[]> {
  return deleteItem<HubVideo>("hub-videos", fixtures.getHubVideos, id);
}
export function setHubVideoPositions(updates: { id: string; position: number }[]): Promise<HubVideo[]> {
  return setPositions<HubVideo>("hub-videos", fixtures.getHubVideos, updates);
}

// Weekly high-impact opportunity spotlight — a singleton, not a list; no
// fixture to seed from, so it's simply absent (null) until an admin first
// saves one.

export async function getWeeklyOpportunity(): Promise<WeeklyOpportunity | null> {
  try {
    const raw = await getBlobStore(CONTENT_STORE).get(WEEKLY_OPPORTUNITY_KEY, { type: "text" });
    return raw ? (JSON.parse(raw) as WeeklyOpportunity) : null;
  } catch {
    return null;
  }
}

export async function saveWeeklyOpportunity(value: WeeklyOpportunity): Promise<void> {
  await getBlobStore(CONTENT_STORE).set(WEEKLY_OPPORTUNITY_KEY, JSON.stringify(value));
}

// Top posts from last week — a list, not a singleton (see lib/data/types.ts
// for why). No fixture to seed from, starts empty until an admin adds one.

export function getTopPosts(): Promise<TopPost[]> {
  return getList<TopPost>("top-posts", noSeed);
}
export function addTopPost(item: TopPost): Promise<void> {
  return addItem("top-posts", noSeed, item);
}
export function updateTopPost(id: string, patch: Partial<TopPost>): Promise<TopPost[]> {
  return updateItem<TopPost>("top-posts", noSeed, id, patch);
}
export function deleteTopPost(id: string): Promise<TopPost[]> {
  return deleteItem<TopPost>("top-posts", noSeed, id);
}
export function setTopPostPositions(updates: { id: string; position: number }[]): Promise<TopPost[]> {
  return setPositions<TopPost>("top-posts", noSeed, updates);
}

// "A message from our top creators" testimonials — no fixture to seed
// from, starts empty until an admin adds the first one.

export function getTestimonials(): Promise<Testimonial[]> {
  return getList<Testimonial>("testimonials", noSeed);
}
export function addTestimonial(item: Testimonial): Promise<void> {
  return addItem("testimonials", noSeed, item);
}
export function updateTestimonial(id: string, patch: Partial<Testimonial>): Promise<Testimonial[]> {
  return updateItem<Testimonial>("testimonials", noSeed, id, patch);
}
export function deleteTestimonial(id: string): Promise<Testimonial[]> {
  return deleteItem<Testimonial>("testimonials", noSeed, id);
}

// Challenges — see lib/data/types.ts's Challenge for the three kinds.
// Seeded once from seedChallenges() above the first time this is asked
// for, same pattern as everything else in this file.

export function getChallenges(): Promise<Challenge[]> {
  return getList<Challenge>("challenges", seedChallenges);
}
export function addChallenge(item: Challenge): Promise<void> {
  return addItem("challenges", seedChallenges, item);
}
export function updateChallenge(id: string, patch: Partial<Challenge>): Promise<Challenge[]> {
  return updateItem<Challenge>("challenges", seedChallenges, id, patch);
}
export function deleteChallenge(id: string): Promise<Challenge[]> {
  return deleteItem<Challenge>("challenges", seedChallenges, id);
}
export function setChallengePositions(updates: { id: string; position: number }[]): Promise<Challenge[]> {
  return setPositions<Challenge>("challenges", seedChallenges, updates);
}

// Page visibility — which nav pages are hidden from creators right now.
// A singleton, defaulting to "nothing hidden" when never saved.

const CHALLENGES_SLOTS = new Set(["top", "middle", "bottom"]);

const GUIDE_STEP_KEYS: TrackStepKey[] = ["getReady", "film", "post15", "audit1", "refilmPost10", "audit2", "plan"];

// Validate/trim a stored or submitted recreation guide. Anything malformed
// becomes "no custom guide" (the built-in default); text parts left blank
// are kept blank here and fall back to their default when read
// (see resolveGuide in lib/newCreatorTrack.ts).
function parseTrackGuide(raw: unknown): TrackGuide | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const steps = {} as TrackGuide["steps"];
  const rawSteps = (r.steps && typeof r.steps === "object" ? r.steps : {}) as Record<string, unknown>;
  for (const key of GUIDE_STEP_KEYS) {
    const s = (rawSteps[key] && typeof rawSteps[key] === "object" ? rawSteps[key] : {}) as Record<string, unknown>;
    steps[key] = { title: text(s.title, 120), body: text(s.body, 2000) };
  }
  const checklist = Array.isArray(r.checklist)
    ? r.checklist
        .filter((i): i is string => typeof i === "string")
        .map((i) => i.trim().slice(0, 240))
        .filter(Boolean)
        .slice(0, 40)
    : [];
  return { checklist, steps, tips: text(r.tips, 6000), keywords: text(r.keywords, 3000) };
}

// Blank (or non-text) means "use the default wording".
function parseTrackNote(raw: unknown): string | null {
  return typeof raw === "string" && raw.trim() ? raw.trim().slice(0, 800) : null;
}

// Clamp/validate a stored or submitted track mix — anything malformed (or
// asking for zero videos) means "no rule", never a half-broken one.
function parseTrackMix(raw: unknown): TrackMix | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const count = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(6, Math.floor(v))) : 0);
  const mix = {
    product: count(r.product),
    lifestyle: count(r.lifestyle),
    hybrid: count(r.hybrid),
    videoIds: Array.isArray(r.videoIds) ? r.videoIds.filter((id): id is string => typeof id === "string") : [],
  };
  return mix.product + mix.lifestyle + mix.hybrid > 0 ? mix : null;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const raw = await getBlobStore(CONTENT_STORE).get(SITE_SETTINGS_KEY, { type: "text" });
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.hiddenNavKeys)) {
        return {
          hiddenNavKeys: parsed.hiddenNavKeys,
          creatorHubChallengesSlot: CHALLENGES_SLOTS.has(parsed?.creatorHubChallengesSlot)
            ? parsed.creatorHubChallengesSlot
            : "middle",
          trackMix: parseTrackMix(parsed?.trackMix),
          trackNote: parseTrackNote(parsed?.trackNote),
          trackGuide: parseTrackGuide(parsed?.trackGuide),
        };
      }
    }
  } catch {
    // fall through to default
  }
  return { hiddenNavKeys: [], creatorHubChallengesSlot: "middle", trackMix: null, trackNote: null, trackGuide: null };
}

// Merges into what's already saved instead of replacing it — each settings
// control (page visibility, Challenges position, track mix) only knows its
// own field, so a whole-object replace let one control silently reset the
// others.
export async function saveSiteSettings(value: Partial<SiteSettings>): Promise<void> {
  const current = await getSiteSettings();
  const next: SiteSettings = {
    ...current,
    ...value,
    trackMix: "trackMix" in value ? parseTrackMix(value.trackMix) : current.trackMix,
    trackNote: "trackNote" in value ? parseTrackNote(value.trackNote) : current.trackNote,
    trackGuide: "trackGuide" in value ? parseTrackGuide(value.trackGuide) : current.trackGuide,
  };
  await getBlobStore(CONTENT_STORE).set(SITE_SETTINGS_KEY, JSON.stringify(next));
}
