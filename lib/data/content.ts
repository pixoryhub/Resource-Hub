// Site content (resources, calendar events, Creator Hub videos) — Blobs-
// backed so admin edits actually persist. lib/data/fixtures.ts holds this
// in a plain in-memory object that "resets on reload" (its own comment) —
// fine for local dev, but a real problem in production, where every
// serverless invocation can be a fresh instance anyway. This module reads
// from Blobs instead, seeding once from the fixtures the first time it's
// ever asked for each content type.

import { getBlobStore } from "@/lib/serverStore";
import * as fixtures from "./fixtures";
import type { Resource, CalendarEvent, HubVideo } from "./types";

const CONTENT_STORE = "pixory-site-content";

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

async function setList<T>(key: string, value: T[]): Promise<void> {
  await getBlobStore(CONTENT_STORE).set(key, JSON.stringify(value));
}

async function addItem<T extends { id: string }>(key: string, seed: () => Promise<T[]>, item: T): Promise<void> {
  const list = await getList(key, seed);
  await setList(key, [...list, item]);
}

async function updateItem<T extends { id: string }>(
  key: string,
  seed: () => Promise<T[]>,
  id: string,
  patch: Partial<T>
): Promise<T[]> {
  const list = await getList(key, seed);
  const next = list.map((x) => (x.id === id ? { ...x, ...patch } : x));
  await setList(key, next);
  return next;
}

async function deleteItem<T extends { id: string }>(key: string, seed: () => Promise<T[]>, id: string): Promise<T[]> {
  const list = await getList(key, seed);
  const next = list.filter((x) => x.id !== id);
  await setList(key, next);
  return next;
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
export async function setHubVideoPositions(updates: { id: string; position: number }[]): Promise<HubVideo[]> {
  const list = await getList<HubVideo>("hub-videos", fixtures.getHubVideos);
  const positionById = new Map(updates.map((u) => [u.id, u.position]));
  const next = list.map((v) => (positionById.has(v.id) ? { ...v, position: positionById.get(v.id)! } : v));
  await setList("hub-videos", next);
  return next;
}
