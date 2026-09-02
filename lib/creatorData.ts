// Server-side read/write of per-creator data (shot lists, Creator Hub
// completions, coaching flags) — the same "pixory-creator-data" Blobs store
// app/api/creator-data uses for a creator's own session, but callable
// directly with any creatorId. Only for server code that's already done its
// own authorization check (the admin routes) — never expose this by id
// over an unauthenticated or creator-session-authenticated endpoint.

import { getBlobStore } from "@/lib/serverStore";

const DATA_STORE = "pixory-creator-data";

export async function loadCreatorDataServer<T>(namespace: string, creatorId: string, fallback: T): Promise<T> {
  const raw = await getBlobStore(DATA_STORE).get(`${namespace}:${creatorId}`, { type: "text" });
  return raw ? (JSON.parse(raw) as T) : fallback;
}

export async function saveCreatorDataServer<T>(namespace: string, creatorId: string, value: T): Promise<void> {
  await getBlobStore(DATA_STORE).set(`${namespace}:${creatorId}`, JSON.stringify(value));
}

// Every namespace a creator's data can live under — see
// lib/creatorStorage.ts (client) and app/api/creator-data (the route that
// namespace comes from). Kept as one list so deleting a creator actually
// deletes all of it, not just whichever namespace someone remembered.
const ALL_NAMESPACES = ["completions", "shotlist-week", "shotlist-archived", "flags"];

export async function deleteAllCreatorData(creatorId: string): Promise<void> {
  const store = getBlobStore(DATA_STORE);
  await Promise.all(ALL_NAMESPACES.map((ns) => store.delete(`${ns}:${creatorId}`)));
}
