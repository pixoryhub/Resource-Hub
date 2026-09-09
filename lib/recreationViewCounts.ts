// Coach-entered view counts for recreation links (see
// components/RecreationLinkBox.tsx and the admin dashboard's "Recreation
// links" section) — there's no reliable way to pull a live view count from
// a TikTok/Instagram/Facebook/YouTube link without platform API access
// those apps don't publicly expose, so a coach types it in once after
// checking and it's saved from then on for everyone.
//
// Keyed by a composite of the submission itself (creatorId + label +
// submittedAt) rather than a stored link id — the link data never carried
// its own id, and this is unique enough in practice without needing to
// change that shape.

import { getBlobStore } from "@/lib/serverStore";

const STORE = "pixory-site-content";
const KEY = "recreation-view-counts";

export function recreationLinkKey(creatorId: string, label: string, submittedAt: string): string {
  return `${creatorId}:${label}:${submittedAt}`;
}

export async function getViewCounts(): Promise<Record<string, number>> {
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

// Same compare-and-swap retry as lib/data/content.ts's mutateList — two
// coaches logging a view count around the same moment shouldn't be able to
// silently drop one of them.
export async function setViewCount(linkKey: string, views: number | null): Promise<void> {
  const store = getBlobStore(STORE);
  for (let attempt = 0; attempt < 8; attempt++) {
    const current = (await store.getWithMetadata(KEY, { type: "json" })) as {
      data: Record<string, number>;
      etag: string;
    } | null;
    const map = current ? current.data : {};
    const next = { ...map };
    if (views === null) delete next[linkKey];
    else next[linkKey] = views;
    const result = await store.set(KEY, JSON.stringify(next), current ? { onlyIfMatch: current.etag } : { onlyIfNew: true });
    if (result.modified) return;
  }
  throw new Error(`Too many conflicting writes to "${KEY}".`);
}
