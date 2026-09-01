export default function ShotListFooter({
  filmed,
  total,
  savedLabel,
  archivedWeekCount,
}: {
  filmed: number;
  total: number;
  savedLabel: string;
  archivedWeekCount: number;
}) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        className="w-full rounded-2xl border border-dashed border-border py-3 text-sm font-semibold text-text-muted transition-colors hover:border-accent hover:text-accent sm:w-auto sm:px-6"
      >
        + add a shot
      </button>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-text-muted">
        <span>
          {filmed} of {total} shots filmed
        </span>
        <span>Saved {savedLabel}</span>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-accent-tint"
        >
          Start a new week
        </button>
        <button
          type="button"
          className="text-left text-sm font-semibold text-text-muted underline decoration-dotted underline-offset-2 hover:text-text"
        >
          Previous weeks ({archivedWeekCount})
        </button>
      </div>
    </div>
  );
}
