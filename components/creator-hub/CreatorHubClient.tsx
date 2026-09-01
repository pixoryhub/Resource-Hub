"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { HubVideo } from "@/lib/data/types";
import { useAdminMode } from "@/lib/adminMode";
import { useAuth } from "@/lib/localAuth";
import { loadCreatorData, saveCreatorData } from "@/lib/creatorStorage";
import VideoRow from "./VideoRow";
import HubVideoForm, { type HubVideoFormData } from "./HubVideoForm";

type Tab = "all" | "completed" | "unfinished";

export default function CreatorHubClient({
  videos: initialVideos,
}: {
  videos: HubVideo[];
}) {
  const { enabled: adminMode } = useAdminMode();
  const { creator } = useAuth();
  const [videos, setVideos] = useState(initialVideos);
  // Maps videoId -> when it was ticked (or null for older data saved before
  // completions carried a timestamp — see the admin dashboard's weekly
  // activity chart, which needs completedAt to place a tick in a given
  // week). `completed` (the Set most of this component reads) is just the
  // keys of this map.
  const [completedAt, setCompletedAt] = useState<Record<string, string | null>>({});
  const completed = useMemo(() => new Set(Object.keys(completedAt)), [completedAt]);
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const loadedForCreator = useRef<string | null>(null);

  // Each creator's own ticks — loaded fresh whenever the logged-in creator
  // changes. loadedForCreator is only set to this creator's id *after* the
  // load resolves — setting it earlier would let the save effect below fire
  // with the still-empty initial `completedAt` state and overwrite whatever
  // was already saved on the server with an empty list. Handles both the
  // old plain-string-array shape and the new {videoId, completedAt} shape.
  useEffect(() => {
    if (!creator || loadedForCreator.current === creator.id) return;
    const id = creator.id;
    loadCreatorData<Array<string | { videoId: string; completedAt: string | null }>>("completions", id, []).then(
      (raw) => {
        const map: Record<string, string | null> = {};
        for (const item of raw) {
          if (typeof item === "string") map[item] = null;
          else map[item.videoId] = item.completedAt;
        }
        setCompletedAt(map);
        loadedForCreator.current = id;
      }
    );
  }, [creator]);

  useEffect(() => {
    if (!creator || loadedForCreator.current !== creator.id) return;
    const entries = Object.entries(completedAt).map(([videoId, at]) => ({ videoId, completedAt: at }));
    saveCreatorData("completions", creator.id, entries);
  }, [completedAt, creator]);

  function toggleCompleted(videoId: string) {
    setCompletedAt((prev) => {
      if (videoId in prev) {
        const next = { ...prev };
        delete next[videoId];
        return next;
      }
      return { ...prev, [videoId]: new Date().toISOString() };
    });
  }

  function addVideo(data: HubVideoFormData) {
    const nextPosition = videos.reduce((max, v) => Math.max(max, v.position), 0) + 1;
    const video: HubVideo = {
      id: `video-${Date.now()}`,
      position: nextPosition,
      updatedAt: new Date().toISOString(),
      ...data,
    };
    setVideos((prev) => [...prev, video]);
    setAdding(false);
  }

  function updateVideo(id: string, data: HubVideoFormData) {
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...data, updatedAt: new Date().toISOString() } : v))
    );
  }

  function deleteVideo(id: string) {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  }

  function moveVideo(id: string, direction: -1 | 1) {
    setVideos((prev) => {
      const sorted = [...prev].sort((a, b) => a.position - b.position);
      const i = sorted.findIndex((v) => v.id === id);
      const j = i + direction;
      if (i === -1 || j < 0 || j >= sorted.length) return prev;
      const a = sorted[i];
      const b = sorted[j];
      return prev.map((v) => {
        if (v.id === a.id) return { ...v, position: b.position };
        if (v.id === b.id) return { ...v, position: a.position };
        return v;
      });
    });
  }

  // Admins can see and manage retired videos too; creators only ever see active ones.
  const pool = adminMode ? videos : videos.filter((v) => v.status === "active");
  const active = videos.filter((v) => v.status === "active");
  const completedCount = active.filter((v) => completed.has(v.id)).length;
  const unfinishedCount = active.length - completedCount;
  const sortedByPosition = useMemo(() => [...videos].sort((a, b) => a.position - b.position), [videos]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...pool]
      .sort((a, b) => a.position - b.position)
      .filter((v) => {
        if (tab === "completed" && !completed.has(v.id)) return false;
        if (tab === "unfinished" && completed.has(v.id)) return false;
        if (!q) return true;
        return (
          v.title.toLowerCase().includes(q) ||
          v.creatorName.toLowerCase().includes(q) ||
          v.desiredCategory.toLowerCase().includes(q)
        );
      });
  }, [pool, tab, completed, query]);

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All", count: active.length },
    { key: "completed", label: "Completed", count: completedCount },
    { key: "unfinished", label: "Unfinished", count: unfinishedCount },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6">
      <div className="card p-5">
        <h2 className="headline text-text">Welcome to the Breakthrough Program</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          You&apos;re in the recreation phase. Study these winning formats, choose your hook
          variation, and execute with precision. Each video includes execution notes and audio
          suggestions to help you nail the format. Tick off each video once you&apos;ve recreated
          it!
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
          <p className="card p-5 text-center text-text-muted">No videos match.</p>
        )}
        {filtered.map((video) => {
          const posIndex = sortedByPosition.findIndex((v) => v.id === video.id);
          return (
            <VideoRow
              key={video.id}
              video={video}
              completed={completed.has(video.id)}
              onToggleCompleted={toggleCompleted}
              onUpdate={(data) => updateVideo(video.id, data)}
              onDelete={() => deleteVideo(video.id)}
              onMove={(direction) => moveVideo(video.id, direction)}
              isFirst={posIndex === 0}
              isLast={posIndex === sortedByPosition.length - 1}
            />
          );
        })}
      </div>

      {adminMode && (
        <div>
          {adding ? (
            <HubVideoForm onSave={addVideo} onCancel={() => setAdding(false)} />
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="w-full rounded-2xl border border-dashed border-border py-3 text-sm font-semibold text-text-muted transition-colors hover:border-accent hover:text-accent"
            >
              + Add a video
            </button>
          )}
        </div>
      )}
    </div>
  );
}
