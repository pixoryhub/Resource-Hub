import { getCurrentWeek, getArchivedWeeks } from "@/lib/data";
import { getSessionCreatorId } from "@/lib/session";
import ProgressCard from "@/components/shot-list/ProgressCard";
import Step1 from "@/components/shot-list/Step1";
import ResultSummary from "@/components/shot-list/ResultSummary";
import GroupCard from "@/components/shot-list/GroupCard";
import VariationExplainer from "@/components/shot-list/VariationExplainer";
import ShotListFooter from "@/components/shot-list/ShotListFooter";

function formatSavedTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

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

  const filmed = week.shots.filter((s) => s.filmed).length;
  const total = week.shots.length;
  const lastFilmedAt = week.shots
    .map((s) => s.filmedAt)
    .filter((v): v is string => Boolean(v))
    .sort()
    .at(-1);
  const savedLabel = formatSavedTime(lastFilmedAt ?? week.createdAt);

  return (
    <div>
      <ProgressCard filmed={filmed} total={total} />

      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
        <div>
          <p className="eyebrow mb-2">Shot List Generator</p>
          <p className="text-text-muted">
            Groups your shots by physical setup, so you film everything that needs the same
            setup back-to-back instead of one video at a time.
          </p>
        </div>

        <Step1 />

        <ResultSummary week={week} />

        <div>
          <h2 className="mb-1 text-lg font-bold text-text">Film one group at a time</h2>
          <p className="mb-4 text-sm text-text-muted">
            Similar shots are grouped so you set up once. Fill in your variations, then work down.
          </p>
          <div className="space-y-4">
            {week.groups.map((group, i) => (
              <GroupCard
                key={group.id}
                group={group}
                index={i + 1}
                shots={week.shots.filter((s) => s.groupId === group.id)}
              />
            ))}
          </div>
        </div>

        <VariationExplainer />

        <ShotListFooter
          filmed={filmed}
          total={total}
          savedLabel={savedLabel}
          archivedWeekCount={archivedWeeks.length}
        />
      </div>
    </div>
  );
}
