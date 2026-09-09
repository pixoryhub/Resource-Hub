// Which recreation links a coach has already reviewed (see the admin
// dashboard's "Recreation links" section) — checking one off moves it out
// of the main list into a collapsed "Reviewed" history instead of deleting
// it, so there's still a record to look back on if a raffle/challenge call
// ever gets questioned later. Same composite key as
// lib/recreationViewCounts.ts (creatorId + label + submittedAt).

import { getBlobStore } from "@/lib/serverStore";

const STORE = "pixory-site-content";
const KEY = "recreation-reviewed-links";

export async function getReviewedLinks(): Promise<Record<string, boolean>> {
  const store = getBlobStore(STORE);
  let raw: string | null;
  try {
    raw = await store.get(KEY, { type: "text" });
  } catch {
    return {};
  }
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

// Same compare-and-swap retry as lib/recreationViewCounts.ts.
export async function setReviewed(linkKey: string, reviewed: boolean): Promise<void> {
  const store = getBlobStore(STORE);
  for (let attempt = 0; attempt < 8; attempt++) {
    const current = (await store.getWithMetadata(KEY, { type: "json" })) as {
      data: Record<string, boolean>;
      etag: string;
    } | null;
    const map = current ? current.data : {};
    const next = { ...map };
    if (reviewed) next[linkKey] = true;
    else delete next[linkKey];
    const result = await store.set(KEY, JSON.stringify(next), current ? { onlyIfMatch: current.etag } : { onlyIfNew: true });
    if (result.modified) return;
  }
  throw new Error(`Too many conflicting writes to "${KEY}".`);
}
