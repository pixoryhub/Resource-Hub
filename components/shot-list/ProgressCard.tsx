export default function ProgressCard({ filmed, total }: { filmed: number; total: number }) {
  const pct = total > 0 ? Math.round((filmed / total) * 100) : 0;

  return (
    <div
      className="sticky z-30 -mx-4 border-b border-border bg-bg/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6"
      style={{ top: "var(--header-h, 64px)" }}
    >
      <div className="mx-auto max-w-3xl">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-semibold text-text">Filming progress</span>
          <span className="text-text-muted">
            {filmed} / {total} shots
          </span>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="accent-gradient h-full rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
