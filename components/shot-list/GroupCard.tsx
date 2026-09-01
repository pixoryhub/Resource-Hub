import type { ShotGroup, Shot } from "@/lib/data/types";
import ShotCard from "./ShotCard";

export default function GroupCard({
  group,
  index,
  shots,
  allGroups,
  readOnly = false,
  onToggleFilmed,
  onRename,
  onVariationNotesChange,
  onDelete,
  onMoveGroup,
}: {
  group: Pick<ShotGroup, "id" | "name" | "colourIndex">;
  index: number | null;
  shots: Shot[];
  allGroups?: ShotGroup[];
  readOnly?: boolean;
  onToggleFilmed?: (shotId: string) => void;
  onRename?: (shotId: string, title: string) => void;
  onVariationNotesChange?: (shotId: string, notes: string) => void;
  onDelete?: (shotId: string) => void;
  onMoveGroup?: (shotId: string, groupId: string) => void;
}) {
  const hasColour = group.colourIndex >= 0;
  const colour = hasColour ? group.colourIndex % 4 : null;

  return (
    <section className="overflow-hidden rounded-[20px] border border-border">
      <div
        className="flex items-center gap-3 px-4 py-3 sm:px-5"
        style={{ background: colour !== null ? `var(--group-tint-${colour})` : "var(--border)" }}
      >
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: colour !== null ? `var(--group-color-${colour})` : "var(--text-faint)" }}
        >
          {index === null ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          ) : (
            index
          )}
        </span>
        <h3 className="flex-1 font-bold text-text">{group.name}</h3>
        <span className="shrink-0 text-sm text-text-muted">
          {shots.length} {shots.length === 1 ? "clip" : "clips"}
        </span>
      </div>

      <div className="space-y-2 bg-bg p-2 sm:p-3">
        {shots.map((shot) => (
          <ShotCard
            key={shot.id}
            shot={shot}
            groups={allGroups}
            readOnly={readOnly}
            onToggleFilmed={onToggleFilmed}
            onRename={onRename}
            onVariationNotesChange={onVariationNotesChange}
            onDelete={onDelete}
            onMoveGroup={onMoveGroup}
          />
        ))}
      </div>
    </section>
  );
}
