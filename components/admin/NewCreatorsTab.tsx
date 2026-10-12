"use client";

// The "New creators" tab — everything about creators on the new creator
// track in one place, so the Overview stays light: audits due up top, then
// one slim row per creator (stage, progress, days since their last step —
// tap for the full timeline), filters, and this week's pick-mix settings.
// Pulls the same /api/admin/dashboard response the Overview uses.

import { useEffect, useMemo, useState } from "react";
import { saveContentAction } from "@/lib/adminContentClient";
import { useSiteSettings } from "@/lib/useSiteSettings";
import type { DesiredCategory, TrackGuide, TrackStepKey } from "@/lib/data/types";
import {
  AUDIT_1_AT,
  AUDIT_2_AT,
  DEFAULT_TRACK_NOTE,
  DEFAULT_TRACK_GUIDE,
  MIX_KEYS,
  MIX_LABELS,
  STAGE_LABELS,
  STEP_KEYS,
  TRACK_RECREATIONS_PER_VIDEO,
  resolveGuide,
  mixKeyOf,
  stuckDays,
  type MixKey,
  type NewCreatorTrackSummary,
} from "@/lib/newCreatorTrack";

type NewCreatorEntry = NewCreatorTrackSummary & {
  id: string;
  firstName: string;
  lastName: string;
  signedUpAt: string | null;
};

interface VideoOption {
  id: string;
  position: number;
  title: string;
  desiredCategory: DesiredCategory;
}

type Filter = "all" | "due" | "starting" | "posting" | "done";

function shortDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : null;
}

const isDue = (c: NewCreatorEntry) => c.stage === "audit1-due" || c.stage === "audit2-due";
const auditDue = (c: NewCreatorEntry): "first" | "second" | null =>
  c.stage === "audit1-due" ? "first" : c.stage === "audit2-due" ? "second" : null;

function stageText(c: NewCreatorEntry) {
  return c.stage === "posting" ? "Posting" : STAGE_LABELS[c.stage];
}

function CreatorRow({
  c,
  onSelectCreator,
  onMarkAudit,
}: {
  c: NewCreatorEntry;
  onSelectCreator: (id: string) => void;
  onMarkAudit: (id: string, audit: "first" | "second") => void;
}) {
  const [open, setOpen] = useState(false);
  const due = auditDue(c);
  const stuck = stuckDays(c, c.signedUpAt);
  const steps = [
    { label: "Signed up", at: c.signedUpAt },
    { label: "Ready", at: c.readyAt },
    { label: "Picked videos", at: c.startedAt },
    { label: "First post", at: c.firstLinkAt },
    { label: `${AUDIT_1_AT} links`, at: c.milestoneAt.first },
    { label: `${AUDIT_2_AT} links`, at: c.milestoneAt.second },
  ];

  return (
    <div className={"overflow-hidden rounded-xl border bg-bg " + (due ? "border-accent" : "border-border")}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-text">
            {c.firstName} {c.lastName}
          </span>
          <span className="block truncate text-xs text-text-muted">
            {stageText(c)}
            {(c.stage === "not-ready" || c.stage === "ready") && c.checklist.total > 0 && (
              <span> · checklist {c.checklist.done}/{c.checklist.total}</span>
            )}
            {stuck !== null && <span className="font-semibold text-accent"> · ⚠ {stuck} days idle</span>}
          </span>
        </span>
        {due && <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-white">Audit due</span>}
        <span className="w-12 shrink-0 text-right text-xs font-bold text-accent">
          {c.startedAt ? `${c.totalLinks}/${AUDIT_2_AT}` : "—"}
        </span>
        <svg
          width="12"
          height="12"
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

      {open && (
        <div className="space-y-2.5 border-t border-border px-3 py-3">
          <ul className="space-y-1">
            {steps.map((st) => (
              <li key={st.label} className="flex items-center justify-between gap-3 text-xs">
                <span className={st.at ? "text-text" : "text-text-faint"}>
                  {st.at ? "✓" : "○"} {st.label}
                </span>
                <span className="text-text-faint">{shortDate(st.at) ?? "—"}</span>
              </li>
            ))}
          </ul>

          {c.checklist.total > 0 && (
            <p className="text-xs text-text-muted">
              Pre-start checklist: <span className="font-bold text-text">{c.checklist.done}/{c.checklist.total}</span> ticked
            </p>
          )}

          {c.videos.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {c.videos.map((v) => (
                <span
                  key={v.id}
                  title={v.title}
                  className={
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold " +
                    (v.linkCount >= TRACK_RECREATIONS_PER_VIDEO ? "bg-accent text-white" : "bg-border text-text-muted")
                  }
                >
                  #{v.position} · {v.linkCount}/{TRACK_RECREATIONS_PER_VIDEO}
                </span>
              ))}
            </div>
          )}

          {(c.auditsDone.first || c.auditsDone.second) && (
            <p className="text-[11px] font-semibold text-text-muted">
              {[
                c.auditsDone.first && `✓ First audit ${shortDate(c.auditsDone.first)}`,
                c.auditsDone.second && `✓ Second audit ${shortDate(c.auditsDone.second)}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}

          <div className="flex items-center gap-3">
            {due && (
              <button
                type="button"
                onClick={() => onMarkAudit(c.id, due)}
                className="rounded-full bg-accent px-3.5 py-1.5 text-xs font-bold text-white hover:opacity-90"
              >
                Mark {due} audit done
              </button>
            )}
            <button
              type="button"
              onClick={() => onSelectCreator(c.id)}
              className="text-xs font-semibold text-text-muted hover:text-accent hover:underline"
            >
              Open profile →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// This week's pick rule for creators starting the new creator track — how
// many videos of each desired category they must choose (and, optionally,
// which videos they can choose from). Only affects creators who haven't
// picked yet; anyone who has already picked keeps their picks.
function TrackMixPanel({ videos }: { videos: VideoOption[] }) {
  const { trackMix, ready } = useSiteSettings();
  const [counts, setCounts] = useState<Record<MixKey, number>>({ hybrid: 0, lifestyle: 0, product: 0 });
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [shortlistOpen, setShortlistOpen] = useState(false);
  const [synced, setSynced] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // useSiteSettings resolves async — copy its result in once, then this
  // panel owns the values locally (same pattern as PageVisibilityPanel).
  if (ready && !synced) {
    if (trackMix) {
      setCounts({ hybrid: trackMix.hybrid, lifestyle: trackMix.lifestyle, product: trackMix.product });
      setShortlist(trackMix.videoIds);
      setShortlistOpen(trackMix.videoIds.length > 0);
    }
    setSynced(true);
  }

  const total = MIX_KEYS.reduce((sum, k) => sum + counts[k], 0);
  const eligible = shortlist.length > 0 ? videos.filter((v) => shortlist.includes(v.id)) : videos;
  const available: Record<MixKey, number> = { hybrid: 0, lifestyle: 0, product: 0 };
  eligible.forEach((v) => (available[mixKeyOf(v)] += 1));
  const shortages = MIX_KEYS.filter((k) => counts[k] > available[k]);

  function save() {
    if (total === 0) return;
    saveContentAction("siteSettings", {
      action: "save",
      value: { trackMix: { ...counts, videoIds: shortlist } },
    });
    setMessage("Saved — creators who start from now on will pick this mix.");
  }

  function clear() {
    saveContentAction("siteSettings", { action: "save", value: { trackMix: null } });
    setCounts({ hybrid: 0, lifestyle: 0, product: 0 });
    setShortlist([]);
    setShortlistOpen(false);
    setMessage("Cleared — creators can pick any videos again.");
  }

  function bump(k: MixKey, delta: number) {
    setCounts((prev) => ({ ...prev, [k]: Math.max(0, Math.min(6, prev[k] + delta)) }));
    setMessage(null);
  }

  return (
    <div className="card space-y-3 p-4">
      <div>
        <p className="font-semibold text-text">🎛️ New creator track mix</p>
        <p className="mt-0.5 text-xs text-text-faint">
          What creators starting their track this week must pick. They can&apos;t choose any other mix. Creators who
          have already picked aren&apos;t affected.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {MIX_KEYS.map((k) => (
          <div key={k} className="rounded-xl border border-border bg-bg p-2.5 text-center">
            <p className="text-xs font-semibold text-text">{MIX_LABELS[k]}</p>
            <div className="mt-1.5 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => bump(k, -1)}
                aria-label={`Fewer ${MIX_LABELS[k]}`}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-sm font-bold text-text-muted hover:border-accent hover:text-accent"
              >
                −
              </button>
              <span className="w-5 text-base font-bold text-text">{counts[k]}</span>
              <button
                type="button"
                onClick={() => bump(k, 1)}
                aria-label={`More ${MIX_LABELS[k]}`}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-sm font-bold text-text-muted hover:border-accent hover:text-accent"
              >
                +
              </button>
            </div>
            <p className="mt-1 text-[11px] text-text-faint">{available[k]} available</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-text-muted">
        {total === 0
          ? "No rule set — creators pick any 5–6 videos."
          : `Each new creator picks ${total} video${total === 1 ? "" : "s"}: ${MIX_KEYS.filter((k) => counts[k] > 0)
              .map((k) => `${counts[k]} ${MIX_LABELS[k]}`)
              .join(" · ")}.`}
      </p>

      {shortages.length > 0 && (
        <p className="text-xs font-semibold text-accent">
          Not enough {shortages.map((k) => MIX_LABELS[k]).join(" / ")} videos on offer for that — creators will only be
          asked for what exists.
        </p>
      )}

      <div>
        <button
          type="button"
          onClick={() => setShortlistOpen((v) => !v)}
          className="text-xs font-semibold text-text-muted hover:text-accent"
          aria-expanded={shortlistOpen}
        >
          {shortlistOpen ? "▾" : "▸"} Limit to specific videos (optional)
          {shortlist.length > 0 ? ` · ${shortlist.length} chosen` : ""}
        </button>
        {shortlistOpen && (
          <div className="mt-2 space-y-1.5">
            <p className="text-[11px] text-text-faint">
              Tick the videos creators can choose from this week. Leave everything unticked to allow any video.
            </p>
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {videos.map((v) => (
                <label
                  key={v.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg bg-bg px-2.5 py-1.5 text-xs text-text"
                >
                  <input
                    type="checkbox"
                    checked={shortlist.includes(v.id)}
                    onChange={() => {
                      setShortlist((prev) => (prev.includes(v.id) ? prev.filter((id) => id !== v.id) : [...prev, v.id]));
                      setMessage(null);
                    }}
                    className="h-4 w-4 shrink-0"
                  />
                  <span className="min-w-0 flex-1 truncate">
                    #{v.position} &ldquo;{v.title}&rdquo;
                  </span>
                  <span className="shrink-0 text-[11px] text-text-faint">{v.desiredCategory.replace(" Desire", "")}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={total === 0}
          className="rounded-full bg-text px-4 py-1.5 text-xs font-bold text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save this week&apos;s mix
        </button>
        <button
          type="button"
          onClick={clear}
          className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-text-muted hover:border-accent hover:text-accent"
        >
          Remove the rule
        </button>
      </div>
      {message && <p className="text-xs font-semibold text-accent">{message}</p>}
    </div>
  );
}


// The reminder new creators see above their videos on the track. Editable
// so coaches can add more guidance later without a code change; blank (or
// "Use default wording") falls back to the built-in text.
function TrackNotePanel() {
  const { trackNote, ready } = useSiteSettings();
  const [text, setText] = useState("");
  const [synced, setSynced] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // useSiteSettings resolves async — copy its result in once, then this
  // panel owns the text locally.
  if (ready && !synced) {
    setText(trackNote ?? DEFAULT_TRACK_NOTE);
    setSynced(true);
  }

  function save(value: string | null) {
    saveContentAction("siteSettings", { action: "save", value: { trackNote: value } });
    setMessage(value ? "Saved — new creators will see this wording." : "Back to the default wording.");
  }

  return (
    <div className="card space-y-3 p-4">
      <div>
        <p className="font-semibold text-text">📝 Note shown to new creators</p>
        <p className="mt-0.5 text-xs text-text-faint">
          Appears at the top of their track, above their videos. Add anything you want them to keep in mind — line
          breaks are kept.
        </p>
      </div>
      <textarea
        rows={4}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setMessage(null);
        }}
        maxLength={800}
        className="w-full resize-y rounded-xl border border-border bg-bg px-3 py-2.5 text-text focus:outline-none focus:ring-2 focus:ring-accent"
        style={{ fontSize: "16px" }}
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => save(text)}
          disabled={!text.trim()}
          className="rounded-full bg-text px-4 py-1.5 text-xs font-bold text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save note
        </button>
        <button
          type="button"
          onClick={() => {
            setText(DEFAULT_TRACK_NOTE);
            save(null);
          }}
          className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-text-muted hover:border-accent hover:text-accent"
        >
          Use default wording
        </button>
      </div>
      {message && <p className="text-xs font-semibold text-accent">{message}</p>}
    </div>
  );
}

const STEP_HINTS: Record<TrackStepKey, string> = {
  getReady: "Shown until they tap “ready to start recreating”.",
  film: "After they pick videos, until their first post.",
  post15: "From their first post until 15 links.",
  audit1: "At 15 links, until you mark the first audit done.",
  refilmPost10: "After the first audit, until 25 links.",
  audit2: "At 25 links, until you mark the second audit done.",
  plan: "After the second audit is marked done.",
};

// The recreation guide new creators read in their track — the instructions
// that used to live in the Notion blueprint. Pre-filled with the blueprint
// wording; edit any part and save, or reset to put the originals back.
function TrackGuidePanel() {
  const { trackGuide, ready } = useSiteSettings();
  const [open, setOpen] = useState(false);
  const [checklist, setChecklist] = useState("");
  const [steps, setSteps] = useState<TrackGuide["steps"]>(DEFAULT_TRACK_GUIDE.steps);
  const [tips, setTips] = useState("");
  const [keywords, setKeywords] = useState("");
  const [synced, setSynced] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function load(guide: TrackGuide) {
    setChecklist(guide.checklist.join("\n"));
    setSteps(guide.steps);
    setTips(guide.tips);
    setKeywords(guide.keywords);
  }

  // useSiteSettings resolves async — copy its result in once, then this
  // panel owns the text locally.
  if (ready && !synced) {
    load(resolveGuide(trackGuide));
    setSynced(true);
  }

  function save() {
    const guide: TrackGuide = {
      checklist: checklist
        .split("\n")
        .map((i) => i.trim())
        .filter(Boolean),
      steps,
      tips,
      keywords,
    };
    saveContentAction("siteSettings", { action: "save", value: { trackGuide: guide } });
    setMessage("Saved — new creators will see the updated guide.");
  }

  function reset() {
    saveContentAction("siteSettings", { action: "save", value: { trackGuide: null } });
    load(DEFAULT_TRACK_GUIDE);
    setMessage("Back to the original blueprint wording.");
  }

  const field =
    "w-full resize-y rounded-xl border border-border bg-bg px-3 py-2.5 text-text focus:outline-none focus:ring-2 focus:ring-accent";

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <span>
          <span className="block font-semibold text-text">📖 Recreation guide</span>
          <span className="mt-0.5 block text-xs text-text-faint">
            The instructions new creators read in their track — next step, checklist, tips and keywords.
          </span>
        </span>
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

      {open && (
        <div className="space-y-5 border-t border-border p-4">
          <div>
            <p className="eyebrow mb-1">Pre-start checklist</p>
            <p className="mb-1.5 text-[11px] text-text-faint">
              One item per line. Creators tick these off and you see their progress. Changing an item&apos;s wording
              clears that tick for anyone who had ticked it.
            </p>
            <textarea rows={8} value={checklist} onChange={(e) => (setChecklist(e.target.value), setMessage(null))} className={field} style={{ fontSize: "16px" }} />
          </div>

          <div>
            <p className="eyebrow mb-1">Steps — “your next step”</p>
            <p className="mb-2 text-[11px] text-text-faint">
              Creators see the step that matches their progress. Use blank lines to separate paragraphs.
            </p>
            <div className="space-y-3">
              {STEP_KEYS.map((key) => (
                <div key={key} className="rounded-xl border border-border bg-bg p-3">
                  <p className="mb-1.5 text-[11px] font-semibold text-text-muted">{STEP_HINTS[key]}</p>
                  <input
                    type="text"
                    value={steps[key].title}
                    onChange={(e) => (setSteps((p) => ({ ...p, [key]: { ...p[key], title: e.target.value } })), setMessage(null))}
                    className={field + " mb-2 font-semibold"}
                    style={{ fontSize: "16px" }}
                    aria-label="Step title"
                  />
                  <textarea
                    rows={4}
                    value={steps[key].body}
                    onChange={(e) => (setSteps((p) => ({ ...p, [key]: { ...p[key], body: e.target.value } })), setMessage(null))}
                    className={field}
                    style={{ fontSize: "16px" }}
                    aria-label="Step text"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="eyebrow mb-1">Filming &amp; editing tips</p>
            <textarea rows={10} value={tips} onChange={(e) => (setTips(e.target.value), setMessage(null))} className={field} style={{ fontSize: "16px" }} />
          </div>

          <div>
            <p className="eyebrow mb-1">Caption keywords</p>
            <p className="mb-1.5 text-[11px] text-text-faint">Separated by commas.</p>
            <textarea rows={3} value={keywords} onChange={(e) => (setKeywords(e.target.value), setMessage(null))} className={field} style={{ fontSize: "16px" }} />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={save}
              className="rounded-full bg-text px-4 py-1.5 text-xs font-bold text-bg transition-opacity hover:opacity-90"
            >
              Save guide
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-text-muted hover:border-accent hover:text-accent"
            >
              Reset to original wording
            </button>
          </div>
          {message && <p className="text-xs font-semibold text-accent">{message}</p>}
        </div>
      )}
    </div>
  );
}

export default function NewCreatorsTab({ onSelectCreator }: { onSelectCreator: (id: string) => void }) {
  const [creators, setCreators] = useState<NewCreatorEntry[] | null>(null);
  const [videos, setVideos] = useState<VideoOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.error) setError(d.error);
        else {
          setCreators(d.newCreators ?? []);
          setVideos(d.videos ?? []);
        }
      })
      .catch(() => !cancelled && setError("Couldn't reach the server."));
    return () => {
      cancelled = true;
    };
  }, []);

  function markAudit(creatorId: string, audit: "first" | "second") {
    const now = new Date().toISOString();
    setCreators((prev) =>
      prev
        ? prev.map((c) =>
            c.id !== creatorId
              ? c
              : {
                  ...c,
                  auditsDone: { ...c.auditsDone, [audit]: now },
                  stage: audit === "second" ? "complete" : c.totalLinks >= AUDIT_2_AT ? "audit2-due" : "posting",
                }
          )
        : prev
    );
    fetch(`/api/admin/creators/${creatorId}/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audit, done: true }),
    }).catch(() => {
      // fire-and-forget — worst case it reverts on reload and can be ticked again
    });
  }

  const buckets: Record<Filter, (c: NewCreatorEntry) => boolean> = {
    all: () => true,
    due: isDue,
    starting: (c) => c.stage === "not-ready" || c.stage === "ready" || c.stage === "picked",
    posting: (c) => c.stage === "posting",
    done: (c) => c.stage === "complete",
  };

  const visible = useMemo(() => {
    if (!creators) return [];
    // Audits due first, then anyone stuck (longest idle first), then the rest.
    return creators
      .filter(buckets[filter])
      .sort((a, b) => {
        const rank = (c: NewCreatorEntry) => (isDue(c) ? 0 : stuckDays(c, c.signedUpAt) !== null ? 1 : 2);
        return (
          rank(a) - rank(b) ||
          (stuckDays(b, b.signedUpAt) ?? 0) - (stuckDays(a, a.signedUpAt) ?? 0) ||
          (b.signedUpAt ?? "").localeCompare(a.signedUpAt ?? "")
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creators, filter]);

  if (error) return <p className="text-accent">{error}</p>;
  if (!creators) return <p className="text-text-muted">Loading…</p>;

  const dueList = creators.filter(isDue);
  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "due", label: "Audit due" },
    { key: "starting", label: "Getting started" },
    { key: "posting", label: "Posting" },
    { key: "done", label: "Finished" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow mb-1">🌱 New creators</p>
        <p className="text-text-muted">
          Creators marked new — where each one is and what needs doing. Audits are due at {AUDIT_1_AT} and{" "}
          {AUDIT_2_AT} links.
        </p>
      </div>

      {dueList.length > 0 && (
        <div className="card space-y-2 border border-accent p-4">
          <p className="text-sm font-bold text-text">Audits due ({dueList.length})</p>
          {dueList.map((c) => {
            const which = auditDue(c)!;
            return (
              <div key={c.id} className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onSelectCreator(c.id)}
                  className="min-w-0 truncate text-sm font-semibold text-text hover:text-accent hover:underline"
                >
                  {c.firstName} {c.lastName}
                  <span className="font-normal text-text-muted"> · {which} audit · {c.totalLinks} links</span>
                </button>
                <button
                  type="button"
                  onClick={() => markAudit(c.id, which)}
                  className="shrink-0 rounded-full bg-accent px-3.5 py-1.5 text-xs font-bold text-white hover:opacity-90"
                >
                  Mark done
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-1 rounded-2xl border border-border bg-surface p-1">
        {FILTERS.map((f) => {
          const n = creators.filter(buckets[f.key]).length;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={
                "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors " +
                (filter === f.key ? "bg-text text-bg" : "text-text-muted hover:bg-accent-tint")
              }
            >
              {f.label} ({n})
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-text-faint">
          {creators.length === 0 ? "Nobody has been marked new yet." : "Nobody in this group right now."}
        </p>
      ) : (
        <div className="space-y-2">
          {visible.map((c) => (
            <CreatorRow key={c.id} c={c} onSelectCreator={onSelectCreator} onMarkAudit={markAudit} />
          ))}
        </div>
      )}

      <TrackMixPanel videos={videos} />

      <TrackNotePanel />

      <TrackGuidePanel />
    </div>
  );
}
