import { getCurrentWeek, getArchivedWeeks } from "@/lib/data";
import { getSessionCreatorId } from "@/lib/session";
import ShotListClient from "@/components/shot-list/ShotListClient";

export default async function ShotListGeneratorPage() {
  const creatorId = getSessionCreatorId();
  const [week, archivedWeeks] = await Promise.all([
    getCurrentWeek(creatorId),
    getArchivedWeeks(creatorId),
  ]);

  if (!week) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="eyebrow mb-3">Shot List Generator</p>
        <h1 className="text-3xl font-bold tracking-tight">No active week yet</h1>
        <p className="mt-3 text-text-muted">
          Paste a Blueprint or pull some Creator Hub videos to get started.
        </p>
      </div>
    );
  }

  return <ShotListClient initialWeek={week} initialArchived={archivedWeeks} />;
}
