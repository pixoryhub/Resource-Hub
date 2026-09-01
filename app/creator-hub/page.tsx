import { getHubVideos, getVideoCompletions } from "@/lib/data";
import { getSessionCreatorId } from "@/lib/session";
import CreatorHubClient from "@/components/creator-hub/CreatorHubClient";

export default async function CreatorHubPage() {
  const creatorId = getSessionCreatorId();
  const [videos, completions] = await Promise.all([
    getHubVideos(),
    getVideoCompletions(creatorId),
  ]);

  return (
    <CreatorHubClient
      videos={videos}
      initialCompletedIds={completions.map((c) => c.videoId)}
    />
  );
}
