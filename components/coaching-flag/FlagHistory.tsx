import type { CoachingFlag } from "@/lib/data/types";
import { COACHING_FLAG_OPTIONS } from "@/lib/data/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function optionLabel(id: string) {
  return COACHING_FLAG_OPTIONS.find((o) => o.id === id);
}

export default function FlagHistory({ flags }: { flags: CoachingFlag[] }) {
  if (flags.length === 0) {
    return <p className="text-sm text-text-faint">No flags submitted yet.</p>;
  }

  return (
    <div className="space-y-3">
      {flags.map((flag) => (
        <div key={flag.id} className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-text-faint">{formatDate(flag.submittedAt)}</p>
            <span
              className={
                "rounded-full px-2.5 py-0.5 text-xs font-semibold " +
                (flag.status === "answered"
                  ? "bg-accent-tint text-accent"
                  : "bg-border text-text-muted")
              }
            >
              {flag.status === "answered" ? "Answered" : "Awaiting response"}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {flag.selectedOptions.map((id) => {
              const opt = optionLabel(id);
              return opt ? (
                <span key={id} className="rounded-full bg-bg px-2.5 py-1 text-xs text-text-muted">
                  {opt.emoji} {opt.label}
                </span>
              ) : null;
            })}
          </div>

          {flag.note && <p className="mt-2 text-sm text-text-muted">&ldquo;{flag.note}&rdquo;</p>}

          {flag.response ? (
            <div className="mt-3 rounded-xl bg-accent-tint p-3 text-sm text-text">
              <p className="mb-1 text-xs font-semibold text-accent">
                {flag.respondedBy ?? "Your coach"}
              </p>
              {flag.response}
            </div>
          ) : (
            <p className="mt-3 text-sm text-text-faint">
              Your coach will reply here within 48 hours of submitting.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
