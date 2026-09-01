import type { Week } from "@/lib/data/types";
import { summarizeWeek, summarySentenceParts } from "@/lib/shotListSummary";

export default function ResultSummary({ week }: { week: Week }) {
  const summary = summarizeWeek(week);
  const parts = summarySentenceParts(summary);

  return (
    <div className="card p-5 sm:p-6">
      <p className="text-text">
        Found <strong className="font-bold">{parts.found}</strong> with {parts.rawShotCount} shots
        between them. That&apos;s only <strong className="font-bold">{parts.visualCount} visuals</strong> to
        film, in <strong className="font-bold">{parts.groupCount} setups</strong>.
        {parts.sharedLine && (
          <>
            <br />
            {parts.sharedLine}
          </>
        )}
      </p>

      <p className="eyebrow mb-3 mt-6">Videos included</p>
      <ul className="space-y-2">
        {week.opportunities.map((opp) => (
          <li
            key={opp.id}
            className="flex items-baseline gap-2 rounded-xl border border-border bg-bg px-4 py-2.5 text-sm"
          >
            <span className="shrink-0 font-semibold text-text">
              {opp.source === "blueprint" ? `Opportunity ${opp.index}` : `Video ${opp.index}`}
            </span>
            <span className="text-text-muted">{opp.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
