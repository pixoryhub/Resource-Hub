// Site content (resources, calendar events, Creator Hub videos) — Blobs-
// backed so admin edits actually persist. lib/data/fixtures.ts holds this
// in a plain in-memory object that "resets on reload" (its own comment) —
// fine for local dev, but a real problem in production, where every
// serverless invocation can be a fresh instance anyway. This module reads
// from Blobs instead, seeding once from the fixtures the first time it's
// ever asked for each content type.

import { getBlobStore } from "@/lib/serverStore";
import * as fixtures from "./fixtures";
import type { Resource, CalendarEvent, HubVideo, WeeklyOpportunity, Testimonial, TopPost } from "./types";

const noSeed = async () => [];

const CONTENT_STORE = "pixory-site-content";
const WEEKLY_OPPORTUNITY_KEY = "weekly-opportunity";

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
  if (raw) return JSON.parse(raw) as T[];

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
