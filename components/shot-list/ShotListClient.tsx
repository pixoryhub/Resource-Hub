"use client";

import { useEffect, useRef, useState } from "react";
import type { Week } from "@/lib/data/types";
import { useAuth } from "@/lib/localAuth";
import { loadCreatorData, saveCreatorData } from "@/lib/creatorStorage";
import ProgressCard from "./ProgressCard";
import Step1 from "./Step1";
import ResultSummary from "./ResultSummary";
import GroupCard from "./GroupCard";
import VariationExplainer from "./VariationExplainer";
import ShotListFooter from "./ShotListFooter";
import PreviousWeeks from "./PreviousWeeks";

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function blankWeek(creatorId: string): Week {
  return {
    id: `week-${Date.now()}`,
    creatorId,
    label: "This week",
    sourceText: null,
    createdAt: new Date().toISOString(),
    archivedAt: null,
    opportunities: [],
    groups: [],
    shots: [],
  };
}

export default function ShotListClient({
  initialWeek,
}: {
  initialWeek: Week; // the §12 golden case — shared template for "Example", not any real creator's data
}) {
  const { creator } = useAuth();
  const [week, setWeek] = useState<Week>(() => blankWeek("pending"));
  const [archived, setArchived] = useState<Week[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const loadedForCreator = useRef<string | null>(null);
  const isFirstRender = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Each creator's own week and archive — loaded fresh whenever the
  // logged-in creator changes, starting blank for anyone with nothing saved
  // yet (never the shared golden-case template — that's only for "Example").
  useEffect(() => {
    if (!creator || loadedForCreator.current === creator.id) return;
    loadedForCreator.current = creator.id;
    const savedWeek = loadCreatorData<Week | null>("shotlist-week", creator.id, null);
    const savedArchived = loadCreatorData<Week[]>("shotlist-archived", creator.id, []);
    setWeek(savedWeek ?? blankWeek(creator.id));
    setArchived(savedArchived);
    const last = (savedWeek?.shots ?? [])
      .map((s) => s.filmedAt)
      .filter((v): v is string => Boolean(v))
      .sort()
      .at(-1);
    setSavedAt(new Date(last ?? savedWeek?.createdAt ?? Date.now()));
  }, [creator]);

  // Debounced autosave simulation — §7.4. Local-only for now (see
  // lib/localAuth.tsx); this just shows the "Saved HH:MM" label reacting to
  // edits and actually persists to this browser via lib/creatorStorage.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSavedAt(new Date());
      if (creator) saveCreatorData("shotlist-week", creator.id, week);
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [week, creator]);

  useEffect(() => {
    if (!creator || loadedForCreator.current !== creator.id) return;
    saveCreatorData("shotlist-archived", creator.id, archived);
  }, [archived, creator]);

  function updateShot(shotId: string, patch: Partial<Week["shots"][number]>) {
    setWeek((w) => ({
      ...w,
      shots: w.shots.map((s) => (s.id === shotId ? { ...s, ...patch } : s)),
    }));
  }

  function toggleFilmed(shotId: string) {
    setWeek((w) => ({
      ...w,
      shots: w.shots.map((s) =>
        s.id === shotId
          ? { ...s, filmed: !s.filmed, filmedAt: !s.filmed ? new Date().toISOString() : null }
          : s
      ),
    }));
  }

  function deleteShot(shotId: string) {
    setWeek((w) => ({ ...w, shots: w.shots.filter((s) => s.id !== shotId) }));
  }

  function addShot() {
    setWeek((w) => ({
      ...w,
      shots: [
        ...w.shots,
        {
          id: `custom-${Date.now()}`,
          weekId: w.id,
          groupId: "ungrouped",
          position: w.shots.length + 1,
          title: "",
          variationNotes: "",
          filmed: false,
          filmedAt: null,
          isCustom: true,
          opportunityTags: [],
        },
      ],
    }));
  }

  function confirmNewWeek() {
    // Note: intentionally not using the setWeek(prev => ...) updater form here —
    // it must stay pure (no side effects), since React (in dev Strict Mode, and
    // potentially in future concurrent-rendering scenarios) may invoke it more
    // than once per update. Reading `week` from the closure and calling both
    // setters once, directly, keeps this a single, predictable side effect.
    if (week.shots.length > 0) {
      const archivedCopy: Week = { ...week, archivedAt: new Date().toISOString() };
      setArchived((prev) => [archivedCopy, ...prev]);
    }
    setWeek(blankWeek(creator?.id ?? week.creatorId));
    setCollapsed(false);
  }

  function loadExample() {
    setWeek({ ...initialWeek, creatorId: creator?.id ?? initialWeek.creatorId });
    setCollapsed(false);
  }

  const filmed = week.shots.filter((s) => s.filmed).length;
  const total = week.shots.length;
  const ungroupedShots = week.shots.filter((s) => !week.groups.some((g) => g.id === s.groupId));

  return (
    <div>
      <ProgressCard filmed={filmed} total={total} />

      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
        <div>
          <p className="eyebrow mb-2">Shot List Generator</p>
          <p className="text-text-muted">
            Groups your shots by physical setup, so you film everything that needs the same
            setup back-to-back instead of one video at a time.
          </p>
        </div>

        <Step1
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((v) => !v)}
          onExample={loadExample}
        />

        {week.opportunities.length > 0 && <ResultSummary week={week} />}

        <div>
          <h2 className="mb-1 text-lg font-bold text-text">Film one group at a time</h2>
          <p className="mb-4 text-sm text-text-muted">
            Similar shots are grouped so you set up once. Fill in your variations, then work down.
          </p>

          {week.groups.length === 0 && ungroupedShots.length === 0 ? (
            <p className="card p-6 text-center text-text-muted">
              No shots yet — pull some from the Creator Hub, paste a Blueprint, or add one below.
            </p>
          ) : (
            <div className="space-y-4">
              {ungroupedShots.length > 0 && (
                <GroupCard
                  group={{ id: "ungrouped", name: "Ungrouped", colourIndex: -1 }}
                  index={null}
                  shots={ungroupedShots}
                  allGroups={week.groups}
                  onToggleFilmed={toggleFilmed}
                  onRename={(id, title) => updateShot(id, { title })}
                  onVariationNotesChange={(id, notes) => updateShot(id, { variationNotes: notes })}
                  onDelete={deleteShot}
                  onMoveGroup={(id, groupId) => updateShot(id, { groupId })}
                />
              )}
              {week.groups.map((group, i) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  index={i + 1}
                  shots={week.shots.filter((s) => s.groupId === group.id)}
                  allGroups={week.groups}
                  onToggleFilmed={toggleFilmed}
                  onRename={(id, title) => updateShot(id, { title })}
                  onVariationNotesChange={(id, notes) => updateShot(id, { variationNotes: notes })}
                  onDelete={deleteShot}
                  onMoveGroup={(id, groupId) => updateShot(id, { groupId })}
                />
              ))}
            </div>
          )}
        </div>

        <VariationExplainer />

        <ShotListFooter
          filmed={filmed}
          total={total}
          savedLabel={savedAt ? formatTime(savedAt) : "—"}
          onAddShot={addShot}
          onConfirmNewWeek={confirmNewWeek}
        />

        <PreviousWeeks weeks={archived} />
      </div>
    </div>
  );
}
