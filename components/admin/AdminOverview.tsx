"use client";

// Program-wide activity view for coaches — KPI totals, an 8-week activity
// chart, category balance, who needs attention (inactive or an overdue
// coaching flag), who's most active this week, and which videos are
// over/under-performing. Pulls from app/api/admin/dashboard.

import { useEffect, useState } from "react";
import { saveContentAction } from "@/lib/adminContentClient";
import { useSiteSettings } from "@/lib/useSiteSettings";

// Kept in sync with components/Header.tsx's NAV_ITEMS keys by hand — small,
// fixed list, not worth sharing a module for.
const HIDEABLE_PAGES = [
  { key: "creator-hub", label: "Creator Hub" },
  { key: "coaching-flag", label: "Coaching Flag" },
  { key: "shot-list-generator", label: "Shot List Generator" },
];

function PageVisibilityPanel() {
  const { hiddenNavKeys: initialHidden, ready } = useSiteSettings();
  const [hidden, setHidden] = useState<string[]>([]);
  const [synced, setSynced] = useState(false);

  // useSiteSettings resolves async — copy its result in once, then this
  // panel owns the value locally (so toggling doesn't fight the fetch).
  if (ready && !synced) {
    setHidden(initialHidden);
    setSynced(true);
  }

  function toggle(key: string) {
    const next = hidden.includes(key) ? hidden.filter((k) => k !== key) : [...hidden, key];
    setHidden(next);
    saveContentAction("siteSettings", { action: "save", value: { hiddenNavKeys: next } });
  }

  return (
    <div className="card space-y-2.5 p-4">
      <p className="eyebrow">Page visibility</p>
      <p className="text-xs text-text-faint">
        Hide a page from creators while you work on it — you&apos;ll still see and can open it
        yourself; everyone else sees a &quot;check back soon&quot; message.
      </p>
      {HIDEABLE_PAGES.map((page) => (
        <label key={page.key} className="flex items-center justify-between gap-3 py-1">
          <span className="text-sm font-medium text-text">{page.label}</span>
          <span className="flex items-center gap-2 text-xs text-text-muted">
            {hidden.includes(page.key) ? "Hidden from creators" : "Visible to creators"}
            <input
              type="checkbox"
              checked={!hidden.includes(page.key)}
              onChange={() => toggle(page.key)}
              className="h-4 w-4"
              aria-label={`${page.label} visible to creators`}
            />
          </span>
        </label>
      ))}
    </div>
  );
}

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

interface VideoStat {
  id: string;
  position: number;
  title: string;
  completions: number;
}

interface CategoryStat {
  category: string;
  completions: number;
  videoCount: number;
}

interface OpportunityMarkedEntry {
  id: string;
  firstName: string;
  lastName: string;
}

interface DashboardData {
  kpis: {
    totalCreators: number;
    totalCompletions: number;
    totalShotsFilmed: number;
    openFlagCount: number;
    videosTotal: number;
    weeklyActiveCreators: number;
    newSignupsThisWeek: number;
    opportunityMarkedDoneCount: number;
  };
  weekly: WeekBucket[];
  needsAttention: NeedsAttentionEntry[];
  mostActive: MostActiveEntry[];
  topVideos: VideoStat[];
  needsPush: VideoStat[];
  categoryBreakdown: CategoryStat[];
  opportunityMarkedDone: OpportunityMarkedEntry[];
  hasWeeklyOpportunity: boolean;
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

// Closed by default so Top videos / Needs a push don't add clutter to the
// page by default — same accordion technique as VideoRow/Step1 elsewhere.
function Dropdown({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
        aria-expanded={open}
      >
        <div>
          <p className="font-semibold text-text">{title}</p>
          {subtitle && <p className="mt-0.5 text-xs text-text-faint">{subtitle}</p>}
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={"shrink-0 text-text-faint transition-transform " + (open ? "" : "-rotate-90")}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div className={"accordion-rows " + (open ? "is-open" : "")}>
        <div>
          <div className="space-y-2 border-t border-border p-3" inert={!open}>
            {children}
          </div>
        </div>
      </div>
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

function CategoryBar({ stat, maxCompletions }: { stat: CategoryStat; maxCompletions: number }) {
  const pct = maxCompletions === 0 ? 0 : Math.round((stat.completions / maxCompletions) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-text">{stat.category}</span>
        <span className="text-xs text-text-faint">
          {stat.completions} cross-off{stat.completions === 1 ? "" : "s"} · {stat.videoCount} video
          {stat.videoCount === 1 ? "" : "s"}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
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

  const maxCategoryCompletions = Math.max(1, ...data.categoryBreakdown.map((c) => c.completions));

  return (
    <div className="space-y-6">
      <PageVisibilityPanel />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiCard label="Creators" value={data.kpis.totalCreators} />
        <KpiCard label="Active this week" value={data.kpis.weeklyActiveCreators} />
        <KpiCard label="New signups this week" value={data.kpis.newSignupsThisWeek} />
        <KpiCard label="Video completions" value={data.kpis.totalCompletions} />
        <KpiCard label="Shots filmed" value={data.kpis.totalShotsFilmed} />
        <KpiCard label="Open coaching flags" value={data.kpis.openFlagCount} />
        {data.hasWeeklyOpportunity && (
          <KpiCard
            label="Marked this week's opportunity"
            value={`${data.kpis.opportunityMarkedDoneCount} / ${data.kpis.totalCreators}`}
          />
        )}
      </div>

      {data.hasWeeklyOpportunity && (
        <Dropdown title={`Marked this week's opportunity (${data.opportunityMarkedDone.length})`}>
          {data.opportunityMarkedDone.length === 0 ? (
            <p className="text-sm text-text-faint">Nobody&apos;s marked it done yet.</p>
          ) : (
            data.opportunityMarkedDone.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => onSelectCreator(entry.id)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-bg p-3 text-left transition-colors hover:border-accent"
              >
                <p className="font-semibold text-text">
                  {entry.firstName} {entry.lastName}
                </p>
                <span className="shrink-0 text-xs font-semibold text-accent">✓ Done</span>
              </button>
            ))
          )}
        </Dropdown>
      )}

      <div>
        <p className="eyebrow mb-2">Activity, last 8 weeks</p>
        <WeeklyChart weeks={data.weekly} />
        <p className="mt-2 text-xs text-text-faint">
          Completions ticked before this feature existed won&apos;t appear here — they had no
          timestamp recorded at the time.
        </p>
      </div>

      <div>
        <p className="eyebrow mb-2">Completion rate by category</p>
        {data.categoryBreakdown.length === 0 ? (
          <p className="text-sm text-text-faint">No active videos yet.</p>
        ) : (
          <div className="card space-y-3 p-4">
            {data.categoryBreakdown.map((stat) => (
              <CategoryBar key={stat.category} stat={stat} maxCompletions={maxCategoryCompletions} />
            ))}
          </div>
        )}
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

      <Dropdown title={`Top ${data.topVideos.length || ""} most crossed-off videos`.trim()}>
        {data.topVideos.length === 0 ? (
          <p className="text-sm text-text-faint">Nothing&apos;s been crossed off yet.</p>
        ) : (
          data.topVideos.map((v, i) => (
            <div key={v.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg p-3">
              <p className="min-w-0 truncate font-semibold text-text">
                #{i + 1} &ldquo;{v.title}&rdquo;
              </p>
              <span className="shrink-0 rounded-full bg-accent-tint px-2.5 py-1 text-xs font-semibold text-accent">
                {v.completions} cross-off{v.completions === 1 ? "" : "s"}
              </span>
            </div>
          ))
        )}
      </Dropdown>

      <Dropdown
        title="Needs a push"
        subtitle="The least crossed-off active videos — worth promoting or revisiting with creators."
      >
        {data.needsPush.length === 0 ? (
          <p className="text-sm text-text-faint">No active videos yet.</p>
        ) : (
          data.needsPush.map((v) => (
            <div key={v.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg p-3">
              <p className="min-w-0 truncate font-semibold text-text">
                #{v.position} &ldquo;{v.title}&rdquo;
              </p>
              <span className="shrink-0 rounded-full bg-border px-2.5 py-1 text-xs font-semibold text-text-muted">
                {v.completions} cross-off{v.completions === 1 ? "" : "s"}
              </span>
            </div>
          ))
        )}
      </Dropdown>
    </div>
  );
}
