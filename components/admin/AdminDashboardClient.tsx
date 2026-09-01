"use client";

// Coach/admin visibility into every creator — what they've ticked off in
// the Creator Hub, how they're using the Shot List Generator, and their
// coaching flag history (with the ability to reply). Gated on Admin mode
// being on; the actual authorization happens server-side in
// app/api/admin/* (this component just won't bother fetching if it's off).

import { useEffect, useState } from "react";
import type { CoachingFlag, Week } from "@/lib/data/types";
import { useAdminMode } from "@/lib/adminMode";
import { COACHING_FLAG_OPTIONS } from "@/lib/data/types";
import GroupCard from "@/components/shot-list/GroupCard";

interface CreatorSummary {
  id: string;
  firstName: string;
  lastName: string;
  videosCompleted: number;
  videosTotal: number;
  openFlagCount: number;
}

interface CreatorDetail {
  creator: { id: string; firstName: string; lastName: string };
  completedVideos: { id: string; position: number; title: string }[];
  videosTotal: number;
  currentWeek: Week | null;
  archivedWeeks: Week[];
  flags: CoachingFlag[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function optionLabel(id: string) {
  return COACHING_FLAG_OPTIONS.find((o) => o.id === id);
}

function ReplyForm({ creatorId, flag, onReplied }: { creatorId: string; flag: CoachingFlag; onReplied: (flag: CoachingFlag) => void }) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!text.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/creators/${creatorId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flagId: flag.id, response: text.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        onReplied(data.flag);
      } else {
        setError(data.error ?? "Couldn't send that — try again.");
      }
    } catch {
      setError("Couldn't reach the server — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <textarea
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Reply to this flag..."
        className="w-full resize-y rounded-xl border border-border bg-surface px-3 py-2 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
        style={{ fontSize: "16px" }}
      />
      {error && <p className="text-xs text-accent">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={submitting || !text.trim()}
        className="rounded-full bg-text px-4 py-1.5 text-xs font-semibold text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? "Sending…" : "Send reply"}
      </button>
    </div>
  );
}

function FlagRow({ creatorId, flag, onReplied }: { creatorId: string; flag: CoachingFlag; onReplied: (flag: CoachingFlag) => void }) {
  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-text-faint">{formatDate(flag.submittedAt)}</p>
        <span
          className={
            "rounded-full px-2.5 py-0.5 text-xs font-semibold " +
            (flag.status === "answered" ? "bg-accent-tint text-accent" : "bg-border text-text-muted")
          }
        >
          {flag.status === "answered" ? "Answered" : "Open"}
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
          <p className="mb-1 text-xs font-semibold text-accent">{flag.respondedBy}</p>
          {flag.response}
        </div>
      ) : (
        <ReplyForm creatorId={creatorId} flag={flag} onReplied={onReplied} />
      )}
    </div>
  );
}

function CreatorDetailView({ id, onBack }: { id: string; onBack: () => void }) {
  const [detail, setDetail] = useState<CreatorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/creators/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) setError(data.error);
        else setDetail(data);
      })
      .catch(() => !cancelled && setError("Couldn't reach the server."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  function handleReplied(updated: CoachingFlag) {
    setDetail((d) => (d ? { ...d, flags: d.flags.map((f) => (f.id === updated.id ? updated : f)) } : d));
  }

  return (
    <div>
      <button type="button" onClick={onBack} className="mb-4 text-sm font-semibold text-text-muted hover:text-text">
        ← All creators
      </button>

      {loading && <p className="text-text-muted">Loading…</p>}
      {error && <p className="text-accent">{error}</p>}

      {detail && (
        <div className="space-y-6">
          <div>
            <h2 className="headline text-text">
              {detail.creator.firstName} {detail.creator.lastName}
            </h2>
            <p className="text-sm text-text-muted">
              {detail.completedVideos.length} of {detail.videosTotal} videos completed
            </p>
          </div>

          <div>
            <p className="eyebrow mb-2">Completed videos</p>
            {detail.completedVideos.length === 0 ? (
              <p className="text-sm text-text-faint">Nothing ticked off yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {detail.completedVideos.map((v) => (
                  <li key={v.id} className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text">
                    #{v.position} &ldquo;{v.title}&rdquo;
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="eyebrow mb-2">Current shot list week</p>
            {!detail.currentWeek || (detail.currentWeek.groups.length === 0 && detail.currentWeek.shots.length === 0) ? (
              <p className="text-sm text-text-faint">Nothing in progress right now.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-text-muted">
                  {detail.currentWeek.shots.filter((s) => s.filmed).length} of {detail.currentWeek.shots.length} shots filmed
                </p>
                {detail.currentWeek.groups.map((group, i) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    index={i + 1}
                    shots={detail.currentWeek!.shots.filter((s) => s.groupId === group.id)}
                    readOnly
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="eyebrow mb-2">Archived weeks ({detail.archivedWeeks.length})</p>
            {detail.archivedWeeks.length === 0 ? (
              <p className="text-sm text-text-faint">None yet.</p>
            ) : (
              <ul className="space-y-1.5 text-sm text-text-muted">
                {detail.archivedWeeks.map((w) => (
                  <li key={w.id}>
                    {w.label} — {w.shots.filter((s) => s.filmed).length} of {w.shots.length} shots filmed
                    {w.archivedAt ? ` · archived ${formatDate(w.archivedAt)}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="eyebrow mb-2">Coaching flags ({detail.flags.length})</p>
            {detail.flags.length === 0 ? (
              <p className="text-sm text-text-faint">No flags submitted.</p>
            ) : (
              <div className="space-y-3">
                {detail.flags.map((flag) => (
                  <FlagRow key={flag.id} creatorId={id} flag={flag} onReplied={handleReplied} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardClient() {
  const { enabled: adminMode, ready } = useAdminMode();
  const [creators, setCreators] = useState<CreatorSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !adminMode) return;
    fetch("/api/admin/creators")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setCreators(data.creators);
      })
      .catch(() => setError("Couldn't reach the server."));
  }, [ready, adminMode]);

  if (!ready) return null;

  if (!adminMode) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <p className="eyebrow mb-2">Creators</p>
        <p className="text-text-muted">Turn on Admin mode (top right) to see creator activity.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
      {selectedId ? (
        <CreatorDetailView id={selectedId} onBack={() => setSelectedId(null)} />
      ) : (
        <>
          <div>
            <p className="eyebrow mb-2">Creators</p>
            <p className="text-text-muted">What everyone&apos;s completed, and any open coaching flags.</p>
          </div>

          {error && <p className="text-accent">{error}</p>}
          {!error && creators === null && <p className="text-text-muted">Loading…</p>}
          {creators && creators.length === 0 && <p className="text-text-muted">No creators signed up yet.</p>}

          <div className="space-y-2">
            {creators?.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className="card card-hover flex w-full items-center justify-between gap-3 p-4 text-left"
              >
                <div>
                  <p className="font-semibold text-text">
                    {c.firstName} {c.lastName}
                  </p>
                  <p className="text-sm text-text-muted">
                    {c.videosCompleted} / {c.videosTotal} videos
                  </p>
                </div>
                {c.openFlagCount > 0 && (
                  <span className="shrink-0 rounded-full bg-accent-tint px-2.5 py-1 text-xs font-semibold text-accent">
                    {c.openFlagCount} open flag{c.openFlagCount > 1 ? "s" : ""}
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
