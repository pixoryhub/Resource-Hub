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
  // Optional because profiles created before this field existed won't have
  // it — treat as "unknown" (never assume a fallback date), not as "just
  // signed up".
  createdAt?: string;
}

export interface PublicCreator {
  id: string;
  firstName: string;
  lastName: string;
  createdAt: string | null;
}

export function toPublicCreator(p: Profile): PublicCreator {
  return { id: p.id, firstName: p.firstName, lastName: p.lastName, createdAt: p.createdAt ?? null };
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

// Compare-and-swap retry on the id index — same fix as lib/data/content.ts's
// mutateList, for the same reason: two signups (or a signup racing a
// deletion) landing close together can otherwise silently lose one of them.
async function mutateIds(mutate: (ids: string[]) => string[]): Promise<string[]> {
  const store = getBlobStore(PROFILES_STORE);
  for (let attempt = 0; attempt < 8; attempt++) {
    const current = (await store.getWithMetadata(ALL_IDS_KEY, { type: "json" })) as { data: string[]; etag: string } | null;
    const ids = current ? current.data : [];
    const next = mutate(ids);
    const result = await store.set(
      ALL_IDS_KEY,
      JSON.stringify(next),
      current ? { onlyIfMatch: current.etag } : { onlyIfNew: true }
    );
    if (result.modified) return next;
  }
  throw new Error(`Too many conflicting writes to "${ALL_IDS_KEY}".`);
}

export async function addToCreatorIndex(id: string): Promise<void> {
  await mutateIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
}

async function removeFromCreatorIndex(id: string): Promise<void> {
  await mutateIds((ids) => ids.filter((existing) => existing !== id));
}

export async function listAllCreators(): Promise<PublicCreator[]> {
  const ids = await listAllCreatorIds();
  const profiles = await Promise.all(ids.map((id) => loadProfileById(id)));
  return profiles.filter((p): p is Profile => p !== null).map(toPublicCreator);
}

// Deletes the profile itself (both the name-keyed and id-keyed blobs) and
// drops it from the index. Does not touch that creator's app data — see
// lib/creatorData.ts's deleteAllCreatorData, called alongside this from the
// admin delete route so both go together.
export async function deleteProfile(id: string): Promise<void> {
  const store = getBlobStore(PROFILES_STORE);
  const nameKey = await store.get(`by-id:${id}`, { type: "text" });
  if (nameKey) await store.delete(nameKey);
  await store.delete(`by-id:${id}`);
  await removeFromCreatorIndex(id);
}
