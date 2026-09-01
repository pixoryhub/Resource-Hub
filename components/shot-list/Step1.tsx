export default function Step1({
  collapsed,
  onToggleCollapsed,
  onExample,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onExample: () => void;
}) {
  return (
    <section className="card p-5 sm:p-6">
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="flex w-full items-start justify-between gap-3 text-left"
        aria-expanded={!collapsed}
      >
        <div>
          <h2 className="text-lg font-bold text-text">Get your shots in</h2>
          <p className="text-sm text-text-muted">Use the Creator Hub, the Blueprint, or both.</p>
        </div>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={
            "mt-1 shrink-0 text-text-faint transition-transform " + (collapsed ? "-rotate-90" : "")
          }
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {!collapsed && (
        <div className="mt-5 space-y-5">
          <div>
            <p className="eyebrow mb-2">Pull videos from the Creator Hub</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                readOnly
                placeholder="Video numbers, e.g. 1, 2, 5"
                className="min-w-0 flex-1 rounded-full border border-border bg-surface px-4 py-3 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
                style={{ fontSize: "16px" }}
              />
              <button
                type="button"
                className="shrink-0 rounded-full bg-text px-6 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
              >
                Get shots
              </button>
            </div>
            <p className="mt-2 text-xs text-text-faint">
              Pulls live from the Creator Hub videos. Enter the video numbers you want to batch.
            </p>
          </div>

          <div>
            <p className="eyebrow mb-2">Or paste a Blueprint</p>
            <textarea
              rows={3}
              readOnly
              placeholder={
                "Open this week's Blueprint, select the whole page, copy, and paste it here.\nDon't worry about tidying it up first."
              }
              className="w-full resize-y rounded-2xl border border-border bg-surface px-4 py-3 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
              style={{ fontSize: "16px" }}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-full bg-text px-6 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
              >
                Find my shots
              </button>
              <button
                type="button"
                onClick={onExample}
                className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-text transition-colors hover:bg-accent-tint"
              >
                Example
              </button>
              <button
                type="button"
                className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-text-muted transition-colors hover:bg-accent-tint"
              >
                Start over
              </button>
            </div>
            <p className="mt-2 text-xs text-text-faint">
              &ldquo;Get shots&rdquo; and &ldquo;Find my shots&rdquo; go live once the Blueprint
              parser is built (checkpoint 10) — &ldquo;Example&rdquo; already works, try it.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
