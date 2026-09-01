import { getFlagsForCreator } from "@/lib/data";
import { getSessionCreatorId } from "@/lib/session";
import CoachingFlagClient from "@/components/coaching-flag/CoachingFlagClient";

export default async function CoachingFlagPage() {
  const creatorId = getSessionCreatorId();
  const flags = await getFlagsForCreator(creatorId);

  return <CoachingFlagClient creatorId={creatorId} initialFlags={flags} />;
}
