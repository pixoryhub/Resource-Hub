"use client";

import { useMemo, useState } from "react";
import type { HubVideo } from "@/lib/data/types";
import VideoRow from "./VideoRow";

type Tab = "all" | "completed" | "unfinished";

export default function CreatorHubClient({
  videos,
  initialCompletedIds,
}: {
  videos: HubVideo[];
  initialCompletedIds: string[];
}) {
  const [completed, setCompleted] = useState<Set<string>>(new Set(initialCompletedIds));
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");

  function toggleCompleted(videoId: string) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(videoId)) next.delete(videoId);
      else next.add(videoId);
      return next;
    });
  }

  const active = videos.filter((v) => v.status === "active");
  const completedCount = active.filter((v) => completed.has(v.id)).length;
  const unfinishedCount = active.length - completedCount;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return active.filter((v) => {
      if (tab === "completed" && !completed.has(v.id)) return false;
      if (tab === "unfinished" && completed.has(v.id)) return false;
      if (!q) return true;
      return (
        v.title.toLowerCase().includes(q) ||
        v.creatorName.toLowerCase().includes(q) ||
        v.desiredCategory.toLowerCase().includes(q)
      );
    });
  }, [active, tab, completed, query]);

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All", count: active.length },
    { key: "completed", label: "Completed", count: completedCount },
    { key: "unfinished", label: "Unfinished", count: unfinishedCount },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <p className="eyebrow mb-2">Creator Hub</p>
        <p className="text-text-muted">
          Proven content for you to recreate, updated biweekly by the content team.
        </p>
      </div>

      <div className="card p-5">
        <h2 className="font-bold text-text">Welcome to the Breakthrough Program</h2>
        <p className="mt-1.5 text-sm text-text-muted">
          You&apos;re in the recreation phase. Study these {active.length} winning formats,
          choose your hook variation, and execute with precision. Each video includes execution
          notes and audio suggestions to help you nail the format. Tick off each video once
          you&apos;ve recreated it!
        </p>
        <p className="mt-3 border-t border-border pt-3 text-xs text-text-faint">
          Please note: this hub is designed for creators who have completed their first 30 days.
          If you&apos;re still within your first month, focus on your 5-in-5 Recreation
          Blueprints first — come back here once you&apos;ve built that foundation and are ready
          to scale.
        </p>
      </div>

      <div className="rounded-xl bg-accent-tint p-3 text-sm text-text">
        Keep a healthy mix of desired categories — try not to only do product desire or only
        hybrid. Each category serves a different purpose in your content.
      </div>

      <div className="flex gap-1 rounded-full border border-border bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={
              "flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors " +
              (tab === t.key ? "bg-text text-bg" : "text-text-muted hover:bg-accent-tint")
            }
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by creator name, desire category, or title..."
        className="w-full rounded-full border border-border bg-surface px-4 py-3 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
        style={{ fontSize: "16px" }}
      />

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="card p-6 text-center text-text-muted">No videos match.</p>
        )}
        {filtered.map((video) => (
          <VideoRow
            key={video.id}
            video={video}
            completed={completed.has(video.id)}
            onToggleCompleted={toggleCompleted}
          />
        ))}
      </div>
    </div>
  );
}
