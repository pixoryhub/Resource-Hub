import { getHubVideos } from "@/lib/data";
import CreatorHubClient from "@/components/creator-hub/CreatorHubClient";

// Hub videos are admin-editable and live in Netlify Blobs (see
// lib/data/content.ts) — that store only exists at request time on
// Netlify's infrastructure, not during `next build`, so this page can't be
// statically prerendered the way it could when the data was static fixtures.
export const dynamic = "force-dynamic";

export default async function CreatorHubPage() {
  const videos = await getHubVideos();
  return <CreatorHubClient videos={videos} />;
}
