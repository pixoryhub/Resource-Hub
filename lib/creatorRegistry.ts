// Shared creator-profile lookups, backed by Netlify Blobs (see
// lib/serverStore.ts). Used by app/api/auth (signup/login) and the
// app/api/admin/* routes (coach visibility into all creators). Kept in one
// place so both stay in sync on the store name and key scheme.

import { getBlobStore } from "@/lib/serverStore";

export const PROFILES_STORE = "pixory-profiles";
const ALL_IDS_KEY = "all-ids";

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  nameKey: string;
  pinHash: string;
}

export interface PublicCreator {
  id: string;
  firstName: string;
  lastName: string;
}

export function toPublicCreator(p: Profile): PublicCreator {
  return { id: p.id, firstName: p.firstName, lastName: p.lastName };
}

export async function loadProfileByNameKey(nameKey: string): Promise<Profile | null> {
  const raw = await getBlobStore(PROFILES_STORE).get(nameKey, { type: "text" });
  return raw ? (JSON.parse(raw) as Profile) : null;
}

export async function loadProfileById(id: string): Promise<Profile | null> {
  const store = getBlobStore(PROFILES_STORE);
  const nameKey = await store.get(`by-id:${id}`, { type: "text" });
  if (!nameKey) return null;
  return loadProfileByNameKey(nameKey);
}

export async function listAllCreatorIds(): Promise<string[]> {
  const raw = await getBlobStore(PROFILES_STORE).get(ALL_IDS_KEY, { type: "text" });
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export async function addToCreatorIndex(id: string): Promise<void> {
  const store = getBlobStore(PROFILES_STORE);
  const ids = await listAllCreatorIds();
  ids.push(id);
  await store.set(ALL_IDS_KEY, JSON.stringify(ids));
}

export async function listAllCreators(): Promise<PublicCreator[]> {
  const ids = await listAllCreatorIds();
  const profiles = await Promise.all(ids.map((id) => loadProfileById(id)));
  return profiles.filter((p): p is Profile => p !== null).map(toPublicCreator);
}
