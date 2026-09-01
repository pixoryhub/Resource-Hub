import type { Shot } from "@/lib/data/types";

export default function ShotCard({ shot }: { shot: Shot }) {
  return (
    <div
      className={
        "card flex gap-3 p-4 transition-opacity " + (shot.filmed ? "opacity-60" : "")
      }
    >
      <span
        className={
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 " +
          (shot.filmed ? "accent-gradient border-transparent" : "border-border")
        }
        aria-hidden
      >
        {shot.filmed && (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <input
            type="text"
            readOnly
            defaultValue={shot.title}
            placeholder="What's the visual?"
            className={
              "min-w-0 flex-1 bg-transparent font-semibold text-text placeholder:text-text-faint focus:outline-none " +
              (shot.filmed ? "line-through decoration-2 decoration-text-muted" : "")
            }
            style={{ fontSize: "16px" }}
          />
          <button
            type="button"
            aria-label="Delete shot"
            className="shrink-0 text-text-faint transition-colors hover:text-text"
          >
            ×
          </button>
        </div>

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

        <input
          type="text"
          readOnly
          defaultValue={shot.variationNotes}
          placeholder="location, outfit, reaction…"
          className="mt-2 w-full bg-transparent text-sm text-text-muted placeholder:text-text-faint focus:outline-none"
          style={{ fontSize: "16px" }}
        />

        <button
          type="button"
          className="mt-2 text-xs font-semibold text-text-faint underline decoration-dotted underline-offset-2 hover:text-text"
        >
          move to another group
        </button>
      </div>
    </div>
  );
}
