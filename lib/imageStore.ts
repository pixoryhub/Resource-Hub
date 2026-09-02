// Storage for admin-uploaded thumbnail images (Netlify Blobs) — lets an
// admin pick their own image (e.g. a screenshot of one specific slide from
// a Canva/Slides deck) instead of relying on whatever og:image a linked
// platform happens to expose. Same shape as lib/videoStore.ts, just for
// images and a separate bucket.

import { getBlobStore } from "@/lib/serverStore";

const IMAGE_STORE = "pixory-thumbnail-images";

export async function saveImage(id: string, data: ArrayBuffer, contentType: string): Promise<void> {
  const store = getBlobStore(IMAGE_STORE);
  await store.set(id, data, { metadata: { contentType } });
}

export async function loadImage(id: string): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  const store = getBlobStore(IMAGE_STORE);
  const result = (await store.getWithMetadata(id, { type: "arrayBuffer" })) as {
    data: ArrayBuffer;
    metadata: Record<string, unknown>;
  } | null;
  if (!result) return null;
  const contentType = typeof result.metadata?.contentType === "string" ? (result.metadata.contentType as string) : "image/jpeg";
  return { data: result.data, contentType };
}

export async function deleteImage(id: string): Promise<void> {
  await getBlobStore(IMAGE_STORE).delete(id);
}
