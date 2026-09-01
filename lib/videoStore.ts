// Storage for uploaded testimonial video files (Netlify Blobs) — these are
// admin-uploaded clips, not external links, so they need actual file
// storage rather than just a URL field. Kept separate from
// lib/data/content.ts's JSON content store since these are binary blobs,
// not JSON.

import { getBlobStore } from "@/lib/serverStore";

const VIDEO_STORE = "pixory-testimonial-videos";

export async function saveVideo(id: string, data: ArrayBuffer, contentType: string): Promise<void> {
  const store = getBlobStore(VIDEO_STORE);
  await store.set(id, data, { metadata: { contentType } });
}

export async function loadVideo(id: string): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  const store = getBlobStore(VIDEO_STORE);
  const result = (await store.getWithMetadata(id, { type: "arrayBuffer" })) as {
    data: ArrayBuffer;
    metadata: Record<string, unknown>;
  } | null;
  if (!result) return null;
  const contentType = typeof result.metadata?.contentType === "string" ? (result.metadata.contentType as string) : "video/mp4";
  return { data: result.data, contentType };
}

export async function deleteVideo(id: string): Promise<void> {
  await getBlobStore(VIDEO_STORE).delete(id);
}
