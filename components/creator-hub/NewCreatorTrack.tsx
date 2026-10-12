"use client";

// New creator track — a new creator taps "ready to start recreating" when
// they're ready (not at signup), picks this week's videos, then recreates
// each one five times. Each picked video is the real hub video row (full
// info, audio, execution notes, plus its link box), rendered by
// CreatorHubClient — so links are the same per-video recreation links the
// whole hub uses and the admin panel already sees them. Hitting 15 and 25
// links earns the first and second audit. Admins see each creator's stage
// and timestamps in the dashboard.

import { useState, type ReactNode } from "react";
import type { HubVideo, TrackGuide, TrackMix } from "@/lib/data/types";
import { useAuth } from "@/lib/localAuth";
import { useAdminMode } from "@/lib/adminMode";
import { saveCreatorData } from "@/lib/creatorStorage";
import {
  TRACK_MAX_VIDEOS,
  TRACK_RECREATIONS_PER_VIDEO,
  AUDIT_1_AT,
  AUDIT_2_AT,
  DEFAULT_TRACK_NOTE,
  MIX_KEYS,
  MIX_LABELS,
  computeStage,
  mixKeyOf,
  mixQuotas,
  nextAudit,
  offeredVideos,
  pickCounts,
  type NewCreatorAudits,
  type NewCreatorTrack as Track,
} from "@/lib/newCreatorTrack";
import type { RecreationLink } from "@/components/RecreationLinkBox";
import TrackGuideView from "./TrackGuideView";

export default function NewCreatorTrack({
  track,
  onChangeTrack,
  audits,
  totalLinks,
  renderVideo,
  mix,
  mixReady,
  note,
  guide,
  ticked,
  onToggleChecklist,
  onReset,
  videos,
  recreationLinks,
}: {
  track: Track | null;
  onChangeTrack: (track: Track) => void;
  // Audits a coach has marked done (admin-only writes).
  audits: NewCreatorAudits | null;
  // Links posted across the picked videos so far.
  totalLinks: number;
  // Renders a picked video as the full hub video row, with a progress pill.
  renderVideo: (video: HubVideo, badge: string) => ReactNode;
  // This week's pick rule from admin (null = no rule, pick freely).
  // mixReady is false until site settings have loaded, so the picker never
  // flashes the unrestricted version before the rule arrives.
  mix: TrackMix | null;
  mixReady: boolean;
  // Coach-editable reminder shown above the videos (null = default wording).
  note: string | null;
  // The recreation guide (null until settings load, so a default never
  // flashes before a coach's edits arrive), and the checklist items this
  // creator has ticked.
  guide: TrackGuide | null;
  ticked: string[];
  onToggleChecklist: (item: string) => void;
  // Admin-only: clears this account's track so a demo can start over.
  onReset: () => void;
  videos: HubVideo[];
  recreationLinks: Record<string, RecreationLink[]>;
}) {
  const { creator } = useAuth();
  const { enabled: adminMode } = useAdminMode();
  const [open, setOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const [picks, setPicks] = useState<string[]>([]);
  const [confirmingReset, setConfirmingReset] = useState(false);

  // Only creators marked new (at signup, or by a coach) see this — plus
  // anyone in Admin mode, as a preview so coaches can demo it on calls.
  if (!creator?.isNew && !adminMode) return null;
  const preview = !creator?.isNew;

  const minPicks = Math.min(5, videos.length);
  const sortedVideos = [...videos].sort((a, b) => a.position - b.position);
  const activeMix = mixReady ? mix : null;
  const offered = activeMix ? offeredVideos(sortedVideos, activeMix) : sortedVideos;
  const quotas = activeMix ? mixQuotas(activeMix, offered) : null;
  const counts = pickCounts(offered, picks);
  const quotaTotal = quotas ? MIX_KEYS.reduce((sum, k) => sum + quotas[k], 0) : 0;
  const pickRuleMet = quotas ? quotaTotal > 0 && MIX_KEYS.every((k) => counts[k] === quotas[k]) : picks.length >= minPicks;
  const hasStarted = !!track?.startedAt;
  const isReady = !!track?.readyAt || hasStarted;
  const pickedVideos = hasStarted ? sortedVideos.filter((v) => track!.videoIds.includes(v.id)) : [];

  const stage = computeStage({
    readyAt: track?.readyAt ?? null,
    startedAt: track?.startedAt ?? null,
    totalLinks,
    firstAuditDone: !!audits?.first,
    secondAuditDone: !!audits?.second,
  });

  function saveTrack(next: Track) {
    onChangeTrack(next);
    if (creator) saveCreatorData("new-creator-track", creator.id, next);
  }

  // "Ready to start recreating" is its own step, timestamped separately
  // from signing up and from locking in picks.
  function markReady() {
    saveTrack({ readyAt: new Date().toISOString(), startedAt: null, videoIds: [] });
    startPicking();
  }

  function startPicking() {
    setPicks((track?.videoIds ?? []).filter((id) => offered.some((v) => v.id === id)));
    setPicking(true);
    setOpen(true);
  }

  function pickBlocked(v: HubVideo): boolean {
    if (picks.includes(v.id)) return false;
    return quotas ? counts[mixKeyOf(v)] >= quotas[mixKeyOf(v)] : picks.length >= TRACK_MAX_VIDEOS;
  }

  function togglePick(v: HubVideo) {
    if (pickBlocked(v)) return;
    setPicks((prev) => (prev.includes(v.id) ? prev.filter((p) => p !== v.id) : [...prev, v.id]));
  }

  function savePicks() {
    if (!creator || !pickRuleMet) return;
    const now = new Date().toISOString();
    saveTrack({ readyAt: track?.readyAt ?? now, startedAt: track?.startedAt ?? now, videoIds: picks });
    setPicking(false);
  }

  const upcoming = nextAudit(totalLinks);
  const summary = hasStarted
    ? upcoming
      ? `${totalLinks} linked · ${upcoming.remaining} more to ${upcoming.label}`
      : "All 25 posted 🎉"
    : isReady
      ? "Pick your videos to begin"
      : "Ready to start your recreation videos?";

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-3.5 text-left"
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-tint text-sm">🌱</span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-text">
              New creator track
              {preview && (
                <span className="ml-2 rounded-full bg-text px-2 py-0.5 align-middle text-[10px] font-bold text-bg">
                  Admin preview
                </span>
              )}
            </span>
            <span className="block truncate text-xs text-text-muted">{summary}</span>
          </span>
        </span>
        <svg
          width="14"
          height="14"
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
          <div className="space-y-3 border-t border-border p-3.5" inert={!open}>
            {adminMode && (
              <div className="space-y-2 rounded-lg border border-dashed border-border bg-bg px-3 py-2">
                {preview && (
                  <p className="text-[11px] leading-relaxed text-text-muted">
                    👀 <span className="font-semibold text-text">Admin preview</span> — this is the new creator track as
                    a new creator sees it. Anything you pick or post here saves to your own account.
                  </p>
                )}
                {confirmingReset ? (
                  <div className="space-y-2">
                    <p className="text-[11px] leading-relaxed text-text-muted">
                      Clears your picked videos, checklist ticks, audit marks and the recreation links you&apos;ve posted
                      on your picked videos, so you can demo from the start. Reset?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onReset();
                          setConfirmingReset(false);
                          setPicking(false);
                        }}
                        className="rounded-full bg-accent px-3.5 py-1.5 text-xs font-bold text-white hover:opacity-90"
                      >
                        Yes, reset
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingReset(false)}
                        className="rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold text-text-muted"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingReset(true)}
                    className="text-xs font-semibold text-text-muted hover:text-accent"
                  >
                    ↺ Reset my track (for demos)
                  </button>
                )}
              </div>
            )}

            {guide && !picking && (
              <TrackGuideView
                guide={guide}
                stage={stage}
                totalLinks={totalLinks}
                ticked={ticked}
                onToggleChecklist={onToggleChecklist}
              />
            )}

            {!isReady && !picking && (
              <>
                <p className="text-xs leading-relaxed text-text-muted">
                  Ready to start your recreation videos? Tap below when you are — you&apos;ll pick your videos from the
                  hub and recreate each one {TRACK_RECREATIONS_PER_VIDEO} times, linking every recreation right here.
                  Your coach does an audit at {AUDIT_1_AT} links and again at {AUDIT_2_AT}.
                </p>
                <button
                  type="button"
                  onClick={markReady}
                  disabled={!mixReady}
                  className="accent-gradient w-full rounded-full py-2.5 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  I&apos;m ready to start recreating
                </button>
              </>
            )}

            {isReady && !hasStarted && !picking && (
              <>
                <p className="text-xs leading-relaxed text-text-muted">
                  You&apos;re ready — now pick the videos you&apos;ll recreate.
                </p>
                <button
                  type="button"
                  onClick={startPicking}
                  disabled={!mixReady}
                  className="accent-gradient w-full rounded-full py-2.5 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  Pick my videos
                </button>
              </>
            )}

            {picking && (
              <>
                {quotas ? (
                  <div className="space-y-1.5">
                    <p className="text-xs leading-relaxed text-text-muted">
                      This week&apos;s mix — pick exactly this many of each, then you&apos;ll recreate each video{" "}
                      {TRACK_RECREATIONS_PER_VIDEO} times.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {MIX_KEYS.filter((k) => quotas[k] > 0).map((k) => (
                        <span
                          key={k}
                          className={
                            "rounded-full px-2.5 py-1 text-[11px] font-bold " +
                            (counts[k] === quotas[k] ? "bg-accent text-white" : "bg-border text-text-muted")
                          }
                        >
                          {MIX_LABELS[k]} {counts[k]}/{quotas[k]}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs leading-relaxed text-text-muted">
                    Pick {minPicks === TRACK_MAX_VIDEOS ? minPicks : `${minPicks}–${TRACK_MAX_VIDEOS}`} videos
                    you&apos;ll recreate {TRACK_RECREATIONS_PER_VIDEO} times each.{" "}
                    <span className="font-semibold text-text">
                      {picks.length} / {TRACK_MAX_VIDEOS} picked
                    </span>
                  </p>
                )}
                {quotas && quotaTotal === 0 ? (
                  <p className="text-xs text-text-muted">
                    There aren&apos;t any videos available to pick right now — check back soon.
                  </p>
                ) : (
                  <div className="max-h-72 space-y-1.5 overflow-y-auto">
                    {offered.map((v) => {
                      const picked = picks.includes(v.id);
                      const blocked = pickBlocked(v);
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => togglePick(v)}
                          disabled={blocked}
                          className={
                            "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-xs transition-colors disabled:opacity-40 " +
                            (picked ? "border-accent bg-accent-tint" : "border-border bg-bg hover:border-accent")
                          }
                        >
                          <span
                            className={
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 text-[10px] font-bold " +
                              (picked ? "border-accent bg-accent text-white" : "border-border")
                            }
                          >
                            {picked ? "✓" : ""}
                          </span>
                          <span className="min-w-0 flex-1 truncate font-semibold text-text">
                            #{v.position} &ldquo;{v.title}&rdquo;
                          </span>
                          <span className="shrink-0 text-[11px] text-text-faint">{v.desiredCategory}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={savePicks}
                    disabled={!pickRuleMet}
                    className="rounded-full bg-text px-4 py-1.5 text-xs font-bold text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {hasStarted ? "Save changes" : "Start my track"}
                  </button>
                  {isReady && (
                    <button
                      type="button"
                      onClick={() => setPicking(false)}
                      className="rounded-full border border-border bg-bg px-4 py-1.5 text-xs font-semibold text-text-muted"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </>
            )}

            {hasStarted && !picking && (
              <>
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold text-text">Your progress</span>
                    <span className="text-xs font-bold text-accent">
                      {totalLinks} / {AUDIT_2_AT}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full transition-[width] duration-500 ease-out"
                      style={{
                        width: `${Math.min(100, Math.round((totalLinks / AUDIT_2_AT) * 100))}%`,
                        background: "linear-gradient(90deg, var(--accent) 0%, var(--accent-light) 100%)",
                      }}
                    />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                    {(
                      [
                        { at: AUDIT_1_AT, done: audits?.first, label: "first audit" },
                        { at: AUDIT_2_AT, done: audits?.second, label: "second audit" },
                      ] as const
                    ).map((m) => (
                      <div
                        key={m.at}
                        className={
                          "rounded-lg px-2.5 py-1.5 font-semibold " +
                          (m.done || totalLinks >= m.at ? "bg-accent text-white" : "bg-bg text-text-muted")
                        }
                      >
                        {m.done ? `✓ ${m.label} done` : totalLinks >= m.at ? `🔍 ${m.label} — coming up` : `${m.at} links · ${m.label}`}
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 whitespace-pre-line rounded-lg bg-accent-tint px-2.5 py-2 text-[11px] leading-relaxed text-text-muted">
                    {note ?? DEFAULT_TRACK_NOTE}
                  </p>
                </div>

                <div className="space-y-3">
                  {pickedVideos.map((v) =>
                    renderVideo(v, `${recreationLinks[v.id]?.length ?? 0} / ${TRACK_RECREATIONS_PER_VIDEO}`)
                  )}
                </div>

                {totalLinks === 0 && (
                  <button
                    type="button"
                    onClick={startPicking}
                    className="text-xs font-semibold text-text-muted hover:text-accent"
                  >
                    Change my videos
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
