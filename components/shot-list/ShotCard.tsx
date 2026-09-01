import type { Shot, ShotGroup } from "@/lib/data/types";

export default function ShotCard({
  shot,
  groups,
  readOnly = false,
  onToggleFilmed,
  onRename,
  onVariationNotesChange,
  onDelete,
  onMoveGroup,
}: {
  shot: Shot;
  groups?: ShotGroup[];
  readOnly?: boolean;
  onToggleFilmed?: (shotId: string) => void;
  onRename?: (shotId: string, title: string) => void;
  onVariationNotesChange?: (shotId: string, notes: string) => void;
  onDelete?: (shotId: string) => void;
  onMoveGroup?: (shotId: string, groupId: string) => void;
}) {
  return (
    <div className={"card flex gap-3 p-4 transition-opacity " + (shot.filmed ? "opacity-60" : "")}>
      <button
        type="button"
        disabled={readOnly}
        onClick={() => onToggleFilmed?.(shot.id)}
        aria-label={shot.filmed ? "Mark as not filmed" : "Mark as filmed"}
        aria-pressed={shot.filmed}
        className={
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors " +
          (shot.filmed ? "accent-gradient border-transparent" : "border-border") +
          (readOnly ? "" : " cursor-pointer hover:border-accent")
        }
      >
        {shot.filmed && (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <input
            type="text"
            readOnly={readOnly}
            value={shot.title}
            onChange={(e) => onRename?.(shot.id, e.target.value)}
            placeholder="What's the visual?"
            className={
              "min-w-0 flex-1 bg-transparent font-semibold text-text placeholder:text-text-faint focus:outline-none " +
              (shot.filmed ? "line-through decoration-2 decoration-text-muted" : "")
            }
            style={{ fontSize: "16px" }}
          />
          {!readOnly && (
            <button
              type="button"
              onClick={() => onDelete?.(shot.id)}
              aria-label="Delete shot"
              className="shrink-0 text-lg leading-none text-text-faint transition-colors hover:text-accent"
            >
              ×
            </button>
          )}
        </div>

        {shot.opportunityTags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {shot.opportunityTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-accent-tint px-2.5 py-0.5 text-xs font-semibold text-accent"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <input
          type="text"
          readOnly={readOnly}
          value={shot.variationNotes}
          onChange={(e) => onVariationNotesChange?.(shot.id, e.target.value)}
          placeholder="location, outfit, reaction…"
          className="mt-2 w-full bg-transparent text-sm text-text-muted placeholder:text-text-faint focus:outline-none"
          style={{ fontSize: "16px" }}
        />

        {!readOnly && groups && groups.length > 1 && (
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) onMoveGroup?.(shot.id, e.target.value);
            }}
            className="mt-2 cursor-pointer appearance-none bg-transparent text-xs font-semibold text-text-faint underline decoration-dotted underline-offset-2 hover:text-text"
          >
            <option value="" disabled>
              move to another group
            </option>
            {groups
              .filter((g) => g.id !== shot.groupId)
              .map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
          </select>
        )}
      </div>
    </div>
  );
}
