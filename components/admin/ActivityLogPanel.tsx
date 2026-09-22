"use client";

// One combined, filterable timeline of past activity — creator joins,
// video completions, recreation links, and coaching flags — instead of a
// separate history panel per feature. Pulls the same /api/admin/dashboard
// response AdminOverview uses (it already computes activityLog server-side
// from data spread across several stores); this tab just filters and
// renders it.

import { useEffect, useMemo, useState } from "react";
import { isWithinDateRange } from "@/lib/dateRange";

interface ActivityLogEntry {
  id: string;
  type: "join" | "completion" | "link" | "flag";
  at: string;
  creatorId: string;
  firstName: string;
  lastName: string;
  detail: string;
  url?: string;
}

const TYPE_LABELS: Record<ActivityLogEntry["type"], string> = {
  join: "Joined",
  completion: "Completed",
  link: "Linked",
  flag: "Flagged",
};

const TYPE_ICONS: Record<ActivityLogEntry["type"], string> = {
  join: "👋",
  completion: "✅",
  link: "🎥",
  flag: "🚩",
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
}

export default function ActivityLogPanel({ onSelectCreator }: { onSelectCreator: (id: string) => void }) {
  const [log, setLog] = useState<ActivityLogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [type, setType] = useState<"all" | ActivityLogEntry["type"]>("all");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.error) setError(d.error);
        else setLog(d.activityLog ?? []);
      })
      .catch(() => !cancelled && setError("Couldn't reach the server."));
    return () => {
      cancelled = true;
    };
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!log) return [];
    return log
      .filter((e) => type === "all" || e.type === type)
      .filter((e) => isWithinDateRange(e.at, dateFrom, dateTo))
      .filter((e) => !q || `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) || e.detail.toLowerCase().includes(q));
  }, [log, type, dateFrom, dateTo, q]);

  if (error) return <p className="text-accent">{error}</p>;
  if (!log) return <p className="text-text-muted">Loading…</p>;

  return (
    <div className="space-y-3">
      <div>
        <p className="eyebrow mb-1">Activity</p>
        <p className="text-text-muted">
          Every creator join, video completion, recreation link, and coaching flag — filter to review
          past activity for a period, a creator, or a type.
        </p>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by creator or detail..."
        className="w-full rounded-full border border-border bg-surface px-3.5 py-2 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
        style={{ fontSize: "16px" }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-semibold text-text-muted" htmlFor="activity-from">
            From
          </label>
          <input
            id="activity-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-border bg-surface px-2 py-1.5 text-text focus:outline-none focus:ring-2 focus:ring-accent"
            style={{ fontSize: "16px" }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-semibold text-text-muted" htmlFor="activity-to">
            To
          </label>
          <input
            id="activity-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-border bg-surface px-2 py-1.5 text-text focus:outline-none focus:ring-2 focus:ring-accent"
            style={{ fontSize: "16px" }}
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            type="button"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
            }}
            className="text-xs font-semibold text-text-muted hover:text-accent"
          >
            Clear dates
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1 rounded-full border border-border bg-surface p-1 sm:w-fit">
        {(["all", "join", "completion", "link", "flag"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors " +
              (type === t ? "bg-text text-bg" : "text-text-muted hover:bg-accent-tint")
            }
          >
            {t === "all" ? "All" : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <p className="text-xs text-text-faint">
        {filtered.length} of {log.length} total
      </p>

      {filtered.length === 0 ? (
        <p className="text-sm text-text-faint">
          {log.length === 0 ? "No activity recorded yet." : "No activity matches those filters."}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => (
            <div key={entry.id} className="flex items-start gap-2.5 rounded-lg bg-surface p-2.5">
              <span className="mt-0.5 shrink-0 text-sm">{TYPE_ICONS[entry.type]}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectCreator(entry.creatorId)}
                    className="truncate text-xs font-semibold text-text hover:text-accent hover:underline"
                  >
                    {entry.firstName} {entry.lastName}
                  </button>
                  <span className="shrink-0 text-[11px] text-text-faint">{formatDateTime(entry.at)}</span>
                </div>
                <p className="truncate text-xs text-text-muted">{entry.detail}</p>
                {entry.url && (
                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-xs font-medium text-accent hover:underline"
                  >
                    {entry.url}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
