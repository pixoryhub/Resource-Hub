import { getHubVideos } from "@/lib/data";
import CreatorHubClient from "@/components/creator-hub/CreatorHubClient";

export default async function CreatorHubPage() {
  const videos = await getHubVideos();
  return <CreatorHubClient videos={videos} />;
}
