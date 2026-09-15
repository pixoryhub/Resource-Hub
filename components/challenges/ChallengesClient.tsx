"use client";

// The Challenges page — one always-open "Raffle", one info-only
// "Spotlight" (Creator of the Week), and one rotating "Featured" challenge
// creators tap to unlock. See lib/data/types.ts's Challenge for the shape,
// and the admin dashboard's "Recreation links" section for where creators'
// links to these end up for coaches to review.

import { useEffect, useMemo, useState } from "react";
import type { Challenge, WeeklyOpportunity } from "@/lib/data/types";
import { useAdminMode } from "@/lib/adminMode";
import { useAuth } from "@/lib/localAuth";
import { loadCreatorData, saveCreatorData } from "@/lib/creatorStorage";
import { saveContentAction } from "@/lib/adminContentClient";
import RecreationLinkBox, { type RecreationLink, normalizeRecreationLinks } from "@/components/RecreationLinkBox";
import ChallengeForm, { type ChallengeFormData } from "./ChallengeForm";

function formatDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function daysLeft(cycleEnd: string): number | null {
  if (!cycleEnd) return null;
  const end = new Date(cycleEnd + "T23:59:59").getTime();
  const days = Math.ceil((end - Date.now()) / 86_400_000);
  return days;
}

// The disclosure every challenge gets — a short trackable checklist stays
// visible up top; however much extra detail a coach wrote goes here,
// however long, without bloating the card itself.
function RulesDisclosure({ label, rules, dark }: { label: string; rules: string; dark?: boolean }) {
  const lines = rules
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;
  return (
    <details className="mt-1">
      <summary
        className={
          "flex cursor-pointer list-none items-center gap-1.5 text-xs font-bold [&::-webkit-details-marker]:hidden " +
          (dark ? "text-white" : "text-accent")
        }
      >
        {label}
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="shrink-0 transition-transform [details[open]_&]:rotate-180">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <ul className="mt-2.5 space-y-1.5">
        {lines.map((line, i) => (
          <li
            key={i}
            className={"relative pl-3.5 text-xs leading-relaxed " + (dark ? "text-white/85" : "text-text-muted")}
          >
            <span className={"absolute left-0 " + (dark ? "text-white" : "text-accent")}>•</span>
            {line}
          </li>
        ))}
      </ul>
    </details>
  );
}

function EditControls({
  onEdit,
  onMove,
  isFirst,
  isLast,
  onDelete,
}: {
  onEdit: () => void;
  onMove: (direction: -1 | 1) => void;
  isFirst: boolean;
  isLast: boolean;
  onDelete: () => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  return (
    <div className="mt-3 flex items-center justify-end gap-1 border-t border-white/20 pt-2">
      <button type="button" onClick={() => onMove(-1)} disabled={isFirst} aria-label="Move up" className="flex h-7 w-7 items-center justify-center rounded-full text-current opacity-70 hover:opacity-100 disabled:opacity-20">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 15l6-6 6 6" /></svg>
      </button>
      <button type="button" onClick={() => onMove(1)} disabled={isLast} aria-label="Move down" className="flex h-7 w-7 items-center justify-center rounded-full text-current opacity-70 hover:opacity-100 disabled:opacity-20">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      <button type="button" onClick={onEdit} aria-label="Edit" className="flex h-7 w-7 items-center justify-center rounded-full text-current opacity-70 hover:opacity-100">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
      </button>
      {confirmingDelete ? (
        <span className="flex items-center gap-1 text-xs">
          <button type="button" onClick={onDelete} className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold text-white">
            Confirm
          </button>
          <button type="button" onClick={() => setConfirmingDelete(false)} className="text-[10px] font-semibold opacity-70">
            Cancel
          </button>
        </span>
      ) : (
        <button type="button" onClick={() => setConfirmingDelete(true)} aria-label="Delete" className="flex h-7 w-7 items-center justify-center rounded-full text-current opacity-70 hover:opacity-100">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" /></svg>
        </button>
      )}
    </div>
  );
}

export default function ChallengesClient({
  initial,
  weeklyOpportunity,
}: {
  initial: Challenge[];
  weeklyOpportunity: WeeklyOpportunity | null;
}) {
  const { enabled: adminMode } = useAdminMode();
  const { creator } = useAuth();
  const [challenges, setChallenges] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // Per-creator state
  const [oppDone, setOppDone] = useState<{ updatedAt: string } | null>(null);
  const [oppLinks, setOppLinks] = useState<RecreationLink[]>([]);
  const [challengeLinks, setChallengeLinks] = useState<Record<string, RecreationLink[]>>({});
  const [joinedIds, setJoinedIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Cross-creator: entrant counts + live activity, loaded once.
  const [activity, setActivity] = useState<{ entrantCounts: Record<string, number>; feed: { label: string; firstName: string; lastName: string; at: string }[] } | null>(null);

  useEffect(() => {
    fetch("/api/challenges/activity")
      .then((r) => r.json())
      .then((data) => setActivity(data))
      .catch(() => setActivity({ entrantCounts: {}, feed: [] }));
  }, []);

  useEffect(() => {
    if (!creator) return;
    let cancelled = false;
    Promise.all([
      loadCreatorData<{ updatedAt: string } | null>("opportunity-completion", creator.id, null),
      loadCreatorData<RecreationLink[] | RecreationLink | null>("recreation-link-weekly-opportunity", creator.id, []),
      loadCreatorData<Record<string, RecreationLink[] | RecreationLink>>("recreation-links", creator.id, {}),
      loadCreatorData<string[]>("challenge-joins", creator.id, []),
    ]).then(([done, links, allLinks, joins]) => {
      if (cancelled) return;
      setOppDone(done);
      setOppLinks(normalizeRecreationLinks(links));
      const sliced: Record<string, RecreationLink[]> = {};
      for (const [key, value] of Object.entries(allLinks)) {
        if (key.startsWith("challenge:")) sliced[key] = normalizeRecreationLinks(value);
      }
      setChallengeLinks(sliced);
      setJoinedIds(joins);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [creator]);

  function submitOppLink(url: string) {
    if (!creator) return;
    const next = [...oppLinks, { url, submittedAt: new Date().toISOString() }];
    setOppLinks(next);
    saveCreatorData("recreation-link-weekly-opportunity", creator.id, next);
  }
  function removeOppLink(index: number) {
    if (!creator) return;
    const next = oppLinks.filter((_, i) => i !== index);
    setOppLinks(next);
    saveCreatorData("recreation-link-weekly-opportunity", creator.id, next);
  }

  // Challenge links share the same "recreation-links" map hub videos use
  // (see components/creator-hub/CreatorHubClient.tsx) — need the full,
  // fresh map on every save so a challenge-link save can't clobber a hub
  // video's links saved from the other page (or vice versa).
  async function saveChallengeLinks(challengeId: string, links: RecreationLink[]) {
    if (!creator) return;
    const key = `challenge:${challengeId}`;
    setChallengeLinks((prev) => ({ ...prev, [key]: links }));
    const fullMap = await loadCreatorData<Record<string, RecreationLink[] | RecreationLink>>("recreation-links", creator.id, {});
    saveCreatorData("recreation-links", creator.id, { ...fullMap, [key]: links });
  }

  function joinChallenge(challengeId: string) {
    if (!creator || joinedIds.includes(challengeId)) return;
    const next = [...joinedIds, challengeId];
    setJoinedIds(next);
    saveCreatorData("challenge-joins", creator.id, next);
  }

  // Admin CRUD ---------------------------------------------------------

  function addChallenge(data: ChallengeFormData) {
    const nextPosition = challenges.reduce((max, c) => Math.max(max, c.position), 0) + 1;
    const item: Challenge = { id: `challenge-${Date.now()}`, position: nextPosition, updatedAt: new Date().toISOString(), ...data };
    setChallenges((prev) => [...prev, item]);
    setAdding(false);
    saveContentAction("challenges", { action: "add", item });
  }
  function updateChallenge(id: string, data: ChallengeFormData) {
    const patch = { ...data, updatedAt: new Date().toISOString() };
    setChallenges((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    setEditingId(null);
    saveContentAction("challenges", { action: "update", id, patch });
  }
  function deleteChallenge(id: string) {
    setChallenges((prev) => prev.filter((c) => c.id !== id));
    setEditingId(null);
    saveContentAction("challenges", { action: "delete", id });
  }
  function moveChallenge(id: string, direction: -1 | 1) {
    const sorted = [...challenges].sort((a, b) => a.position - b.position);
    const i = sorted.findIndex((c) => c.id === id);
    const j = i + direction;
    if (i === -1 || j < 0 || j >= sorted.length) return;
    const a = sorted[i];
    const b = sorted[j];
    setChallenges((prev) => prev.map((c) => (c.id === a.id ? { ...c, position: b.position } : c.id === b.id ? { ...c, position: a.position } : c)));
    saveContentAction("challenges", {
      action: "reorder",
      positions: [{ id: a.id, position: b.position }, { id: b.id, position: a.position }],
    });
  }

  const pool = adminMode ? challenges : challenges.filter((c) => c.status === "active");
  const sorted = useMemo(() => [...pool].sort((a, b) => a.position - b.position), [pool]);
  const raffle = sorted.find((c) => c.kind === "raffle");
  const spotlight = sorted.find((c) => c.kind === "spotlight");
  const featured = sorted.find((c) => c.kind === "featured");
  const editingChallenge = challenges.find((c) => c.id === editingId);
  const allSorted = [...challenges].sort((a, b) => a.position - b.position);

  const oppStep1 = !!(weeklyOpportunity && oppDone?.updatedAt === weeklyOpportunity.updatedAt);
  const oppStep2 = oppLinks.length > 0;
  const raffleEntrants = raffle ? activity?.entrantCounts[raffle.id] ?? 0 : 0;
  const featuredJoined = featured ? joinedIds.includes(featured.id) : false;
  const featuredLinks = featured ? challengeLinks[`challenge:${featured.id}`] ?? [] : [];
  const featuredEntrants = featured ? activity?.entrantCounts[featured.id] ?? 0 : 0;
  const featuredDaysLeft = featured ? daysLeft(featured.cycleEnd) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
      <div>
        <p className="eyebrow mb-1">✦ Challenges</p>
        <h1 className="headline text-text">Everything you can win right now</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          One big challenge to unlock each cycle. Two smaller ones always running in the background.
        </p>
      </div>

      {editingChallenge ? (
        <ChallengeForm initial={editingChallenge} onSave={(data) => updateChallenge(editingChallenge.id, data)} onCancel={() => setEditingId(null)} />
      ) : adding ? (
        <ChallengeForm onSave={addChallenge} onCancel={() => setAdding(false)} />
      ) : (
        <>
          {/* ---------------- Featured (rotating, lock/join) ---------------- */}
          {featured && (
            <div>
              <p className="eyebrow mb-2">This cycle&apos;s challenge</p>

              {!featuredJoined ? (
                <div className="animate-shimmer relative overflow-hidden rounded-[24px] p-6 text-white shadow-lg" style={{ background: "#17130f" }}>
                  <div className="relative flex items-start justify-between gap-3">
                    <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-bold">🔒 Locked</span>
                    {featuredDaysLeft !== null && (
                      <span className="text-xs font-bold text-accent-light">⏳ {featuredDaysLeft}d left</span>
                    )}
                  </div>
                  <div className="relative mt-4 flex items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0">
                      {featured.prizeImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded prize photo
                        <img src={featured.prizeImageUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" style={{ filter: "blur(3px) brightness(0.6) saturate(1.3)" }} />
                      ) : (
                        <div className="h-16 w-16 rounded-2xl bg-accent/40" />
                      )}
                      <span className="absolute inset-0 flex items-center justify-center text-2xl">🔒</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-extrabold">{featured.title}</p>
                      <p className="mt-0.5 text-xs text-white/65">Join to reveal the full prize, criteria, and your own tracker.</p>
                    </div>
                  </div>
                  {featuredEntrants > 0 && (
                    <p className="relative mt-4 text-xs text-white/70">
                      <span className="font-bold text-white">{featuredEntrants} creator{featuredEntrants === 1 ? "" : "s"}</span> already unlocked this one
                    </p>
                  )}
                  {creator && (
                    <button
                      type="button"
                      onClick={() => joinChallenge(featured.id)}
                      className="animate-unlock-glow accent-gradient relative mt-4 w-full rounded-full py-3 text-sm font-bold text-white shadow-sm"
                    >
                      🔓 Unlock this challenge
                    </button>
                  )}
                  {adminMode && (
                    <EditControls
                      onEdit={() => setEditingId(featured.id)}
                      onMove={(d) => moveChallenge(featured.id, d)}
                      isFirst={allSorted[0]?.id === featured.id}
                      isLast={allSorted[allSorted.length - 1]?.id === featured.id}
                      onDelete={() => deleteChallenge(featured.id)}
                    />
                  )}
                </div>
              ) : (
                <div
                  className="relative overflow-hidden rounded-[24px] p-6 text-white shadow-lg"
                  style={{ background: "linear-gradient(135deg, var(--accent-light), var(--accent))" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="animate-pop rounded-full bg-white/22 px-3 py-1 text-xs font-bold">✓ You&apos;re in</span>
                    {featuredDaysLeft !== null && <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-bold">⏳ {featuredDaysLeft}d left</span>}
                  </div>
                  <h2 className="mt-3 text-xl font-extrabold leading-tight">{featured.title}</h2>
                  <p className="mt-1.5 text-sm text-white/90">{featured.description}</p>

                  <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/16 p-3">
                    {featured.prizeImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded prize photo
                      <img src={featured.prizeImageUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-lg" style={{ color: "var(--accent)" }}>🎁</span>
                    )}
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-white/75">Prize this cycle</p>
                      <p className="truncate text-sm font-bold">{featured.prizeText || "TBA"}</p>
                    </div>
                  </div>

                  {featured.criteria.length > 0 && (
                    <div className="mt-4 space-y-1.5">
                      {featured.criteria.map((c, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-2 border-white/55" />
                          {c}
                        </div>
                      ))}
                    </div>
                  )}

                  <RulesDisclosure label="Full rules from your coaches" rules={featured.rules} dark />

                  {featuredEntrants > 0 && (
                    <p className="mt-4 text-xs text-white/85">
                      <span className="font-bold">{featuredEntrants} creator{featuredEntrants === 1 ? "" : "s"}</span> have entered
                    </p>
                  )}

                  {creator && (
                    <div className="mt-4">
                      <RecreationLinkBox value={featuredLinks} onSubmit={(url) => saveChallengeLinks(featured.id, [...featuredLinks, { url, submittedAt: new Date().toISOString() }])} onRemove={(i) => saveChallengeLinks(featured.id, featuredLinks.filter((_, idx) => idx !== i))} />
                    </div>
                  )}

                  {adminMode && (
                    <EditControls
                      onEdit={() => setEditingId(featured.id)}
                      onMove={(d) => moveChallenge(featured.id, d)}
                      isFirst={allSorted[0]?.id === featured.id}
                      isLast={allSorted[allSorted.length - 1]?.id === featured.id}
                      onDelete={() => deleteChallenge(featured.id)}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* ---------------- Standing: Raffle + Spotlight ---------------- */}
          <div>
            <p className="eyebrow mb-2">Always running</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {raffle && (
                <div className="card p-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-tint text-sm" style={{ color: "var(--accent)" }}>🎟️</span>
                    <p className="text-sm font-bold text-text">{raffle.title}</p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-text-muted">{raffle.description}</p>
                  {raffle.prizeText && (
                    <span className="mt-2 inline-flex rounded-full bg-accent-tint px-2.5 py-1 text-[11px] font-bold" style={{ color: "var(--accent)" }}>
                      🎁 {raffle.prizeText}
                    </span>
                  )}
                  {(raffle.cycleStart || raffle.cycleEnd) && (
                    <p className="mt-1.5 text-[11px] text-text-faint">Cycle: {formatDate(raffle.cycleStart)} – {formatDate(raffle.cycleEnd)}</p>
                  )}

                  <RulesDisclosure label="Full rules" rules={raffle.rules} />

                  {creator && loaded && (
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center gap-2 rounded-lg bg-bg px-2.5 py-1.5 text-xs font-semibold text-text">
                        <span>{oppStep1 ? "✅" : "⬜"}</span> Mark this week&apos;s opportunity done
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-bg px-2.5 py-1.5 text-xs font-semibold text-text">
                        <span>{oppStep2 ? "✅" : "⬜"}</span> Link your recreation
                      </div>
                    </div>
                  )}

                  {raffleEntrants > 0 && (
                    <p className="mt-2.5 text-[11px] text-text-faint">
                      <span className="font-bold text-text-muted">{raffleEntrants}</span> creator{raffleEntrants === 1 ? "" : "s"} qualified this cycle
                    </p>
                  )}

                  {creator && (
                    <div className="mt-2.5">
                      <RecreationLinkBox value={oppLinks} onSubmit={submitOppLink} onRemove={removeOppLink} />
                    </div>
                  )}

                  {adminMode && (
                    <EditControls
                      onEdit={() => setEditingId(raffle.id)}
                      onMove={(d) => moveChallenge(raffle.id, d)}
                      isFirst={allSorted[0]?.id === raffle.id}
                      isLast={allSorted[allSorted.length - 1]?.id === raffle.id}
                      onDelete={() => deleteChallenge(raffle.id)}
                    />
                  )}
                </div>
              )}

              {spotlight && (
                <div className="card p-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-tint text-sm" style={{ color: "var(--accent)" }}>✦</span>
                    <p className="text-sm font-bold text-text">{spotlight.title}</p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-text-muted">{spotlight.description}</p>
                  {spotlight.prizeText && (
                    <span className="mt-2 inline-flex rounded-full bg-accent-tint px-2.5 py-1 text-[11px] font-bold" style={{ color: "var(--accent)" }}>
                      💵 {spotlight.prizeText}
                    </span>
                  )}
                  {(spotlight.cycleStart || spotlight.cycleEnd) && (
                    <p className="mt-1.5 text-[11px] text-text-faint">Announced: {formatDate(spotlight.cycleEnd)}</p>
                  )}

                  <RulesDisclosure label="How it's judged" rules={spotlight.rules} />

                  <p className="mt-3 rounded-lg bg-bg px-2.5 py-1.5 text-[11px] font-semibold text-text-faint">
                    👀 No tracker for this one — just keep showing up.
                  </p>

                  {adminMode && (
                    <EditControls
                      onEdit={() => setEditingId(spotlight.id)}
                      onMove={(d) => moveChallenge(spotlight.id, d)}
                      isFirst={allSorted[0]?.id === spotlight.id}
                      isLast={allSorted[allSorted.length - 1]?.id === spotlight.id}
                      onDelete={() => deleteChallenge(spotlight.id)}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ---------------- Live activity ---------------- */}
          {activity && activity.feed.length > 0 && (
            <div>
              <p className="eyebrow mb-2">Live activity</p>
              <div className="card divide-y divide-border p-1">
                {activity.feed.map((entry, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-tint text-[11px] font-bold" style={{ color: "var(--accent)" }}>
                      {entry.firstName.charAt(0).toUpperCase()}
                    </span>
                    <p className="min-w-0 flex-1 truncate text-xs text-text">
                      <span className="font-bold">{entry.firstName}</span> {entry.label}
                    </p>
                    <span className="shrink-0 text-[10.5px] text-text-faint">
                      {new Date(entry.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {adminMode && !editingChallenge && !adding && (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="w-full rounded-2xl border border-dashed border-border py-3 text-sm font-semibold text-text-muted transition-colors hover:border-accent hover:text-accent"
        >
          + Add a challenge
        </button>
      )}
    </div>
  );
}
