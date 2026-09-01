"use client";

// Program-wide activity view for coaches — KPI totals, an 8-week activity
// chart, who needs attention (inactive or an overdue coaching flag), and
// who's most active this week. Pulls from app/api/admin/dashboard.

import { useEffect, useState } from "react";

interface WeekBucket {
  weekStart: string;
  completions: number;
  shotsFilmed: number;
  flagsSubmitted: number;
}

interface NeedsAttentionEntry {
  id: string;
  firstName: string;
  lastName: string;
  reason: string;
}

interface MostActiveEntry {
  id: string;
  firstName: string;
  lastName: string;
  activityCount: number;
}

interface DashboardData {
  kpis: {
    totalCreators: number;
    totalCompletions: number;
    totalShotsFilmed: number;
    openFlagCount: number;
    videosTotal: number;
  };
  weekly: WeekBucket[];
  needsAttention: NeedsAttentionEntry[];
  mostActive: MostActiveEntry[];
}

function formatWeek(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function KpiCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card p-4">
      <p className="eyebrow mb-1">{label}</p>
      <p className="text-2xl font-bold text-text">{value}</p>
    </div>
  );
}

function WeeklyChart({ weeks }: { weeks: WeekBucket[] }) {
  const max = Math.max(1, ...weeks.flatMap((w) => [w.completions, w.shotsFilmed, w.flagsSubmitted]));
  const CHART_HEIGHT = 120;

  const series: { key: keyof WeekBucket; label: string; colour: string }[] = [
    { key: "completions", label: "Video completions", colour: "var(--group-color-0)" },
    { key: "shotsFilmed", label: "Shots filmed", colour: "var(--group-color-1)" },
    { key: "flagsSubmitted", label: "Flags submitted", colour: "var(--group-color-4)" },
  ];

  return (
    <div className="card p-4">
      <div className="mb-3 flex flex-wrap gap-3">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.colour }} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="flex items-end gap-2 overflow-x-auto pb-1" style={{ height: CHART_HEIGHT + 28 }}>
        {weeks.map((w) => (
          <div key={w.weekStart} className="flex shrink-0 flex-col items-center gap-1" style={{ width: 56 }}>
            <div className="flex items-end gap-0.5" style={{ height: CHART_HEIGHT }}>
              {series.map((s) => {
                const value = w[s.key] as number;
                const height = value === 0 ? 2 : Math.max(4, (value / max) * CHART_HEIGHT);
                return (
                  <div
                    key={s.key}
                    title={`${s.label}: ${value}`}
                    className="w-3 rounded-t"
                    style={{ height, background: s.colour, opacity: value === 0 ? 0.25 : 1 }}
                  />
                );
              })}
            </div>
            <span className="text-[11px] text-text-faint">{formatWeek(w.weekStart)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminOverview({ onSelectCreator }: { onSelectCreator: (id: string) => void }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => !cancelled && setError("Couldn't reach the server."));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="text-accent">{error}</p>;
  if (!data) return <p className="text-text-muted">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Creators" value={data.kpis.totalCreators} />
        <KpiCard label="Video completions" value={data.kpis.totalCompletions} />
        <KpiCard label="Shots filmed" value={data.kpis.totalShotsFilmed} />
        <KpiCard label="Open coaching flags" value={data.kpis.openFlagCount} />
      </div>

      <div>
        <p className="eyebrow mb-2">Activity, last 8 weeks</p>
        <WeeklyChart weeks={data.weekly} />
        <p className="mt-2 text-xs text-text-faint">
          Completions ticked before this feature existed won&apos;t appear here — they had no
          timestamp recorded at the time.
        </p>
      </div>

      <div>
        <p className="eyebrow mb-2">Needs attention ({data.needsAttention.length})</p>
        {data.needsAttention.length === 0 ? (
          <p className="text-sm text-text-faint">Nobody&apos;s overdue for a check-in right now.</p>
        ) : (
          <div className="space-y-2">
            {data.needsAttention.map((entry, i) => (
              <button
                key={`${entry.id}-${i}`}
                type="button"
                onClick={() => onSelectCreator(entry.id)}
                className="card card-hover flex w-full items-center justify-between gap-3 p-3 text-left"
              >
                <p className="font-semibold text-text">
                  {entry.firstName} {entry.lastName}
                </p>
                <span className="shrink-0 rounded-full bg-accent-tint px-2.5 py-1 text-xs font-semibold text-accent">
                  {entry.reason}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="eyebrow mb-2">Most active this week</p>
        {data.mostActive.length === 0 ? (
          <p className="text-sm text-text-faint">No activity logged yet this week.</p>
        ) : (
          <div className="space-y-2">
            {data.mostActive.map((entry, i) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => onSelectCreator(entry.id)}
                className="card card-hover flex w-full items-center justify-between gap-3 p-3 text-left"
              >
                <p className="font-semibold text-text">
                  #{i + 1} {entry.firstName} {entry.lastName}
                </p>
                <span className="shrink-0 rounded-full bg-border px-2.5 py-1 text-xs font-semibold text-text-muted">
                  {entry.activityCount} action{entry.activityCount === 1 ? "" : "s"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
