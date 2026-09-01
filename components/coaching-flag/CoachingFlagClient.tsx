"use client";

import { useEffect, useRef, useState } from "react";
import type { CoachingFlag, CoachingFlagOptionId } from "@/lib/data/types";
import { COACHING_FLAG_OPTIONS } from "@/lib/data/types";
import { nextAvailableAt, isBlocked, hoursRemainingOnPromise } from "@/lib/coachingFlagEligibility";
import { useAuth } from "@/lib/localAuth";
import { loadCreatorData, saveCreatorData } from "@/lib/creatorStorage";
import FlagHistory from "./FlagHistory";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

export default function CoachingFlagClient() {
  const { creator } = useAuth();
  const [flags, setFlags] = useState<CoachingFlag[]>([]);
  const [selected, setSelected] = useState<Set<CoachingFlagOptionId>>(new Set());
  const [note, setNote] = useState("");
  const [justSubmitted, setJustSubmitted] = useState<CoachingFlag | null>(null);
  const loadedForCreator = useRef<string | null>(null);

  // Each creator's own flags — loaded fresh whenever the logged-in creator
  // changes. A brand new profile starts with no flags at all.
  useEffect(() => {
    if (!creator || loadedForCreator.current === creator.id) return;
    loadedForCreator.current = creator.id;
    setFlags(loadCreatorData<CoachingFlag[]>("flags", creator.id, []));
  }, [creator]);

  useEffect(() => {
    if (!creator || loadedForCreator.current !== creator.id) return;
    saveCreatorData("flags", creator.id, flags);
  }, [flags, creator]);

  const now = new Date();
  const mostRecent = flags[0];
  const blocked = isBlocked(flags, now);
  const unlockDate = nextAvailableAt(mostRecent);

  function toggleOption(id: CoachingFlagOptionId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    if (selected.size === 0 || !creator) return;
    const flag: CoachingFlag = {
      id: `flag-${Date.now()}`,
      creatorId: creator.id,
      selectedOptions: Array.from(selected),
      note: note.trim(),
      submittedAt: new Date().toISOString(),
      respondedAt: null,
      respondedBy: null,
      response: null,
      status: "open",
    };
    setFlags((prev) => [flag, ...prev]);
    setJustSubmitted(flag);
    setSelected(new Set());
    setNote("");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6">
      <div>
        <p className="eyebrow mb-2">🚩 Coaching Flag</p>
        <p className="text-text-muted">Let your coach know how you&apos;re doing. Only coaches can see this.</p>
      </div>

      {justSubmitted ? (
        <div className="card p-5">
          <h2 className="headline text-text">Sent to your coach</h2>
          <p className="mt-2 text-sm text-text-muted">
            Submitted {formatDate(new Date(justSubmitted.submittedAt))}. Your coach will reply
            within 48 hours.
          </p>
          {unlockDate && (
            <p className="mt-1 text-sm text-text-faint">
              Your next flag unlocks on {formatDate(nextAvailableAt(justSubmitted)!)}.
            </p>
          )}
        </div>
      ) : blocked && mostRecent ? (
        <div className="card p-5">
          <h2 className="headline text-text">You&apos;ve already flagged this window</h2>
          <p className="mt-2 text-sm text-text-muted">
            One flag every two weeks makes sure your coaches can get to everybody. Your next flag
            is available on <strong className="text-text">{formatDate(unlockDate!)}</strong>.
          </p>
          {mostRecent.status === "open" && (
            <p className="mt-2 text-sm text-text-faint">
              Your last flag is still awaiting a reply
              {hoursRemainingOnPromise(mostRecent, now) > 0
                ? ` — about ${hoursRemainingOnPromise(mostRecent, now)}h left on the 48-hour promise.`
                : " — a reply is due any moment."}
            </p>
          )}
          <p className="mt-4 text-xs font-semibold text-text-faint">What you submitted last time</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {mostRecent.selectedOptions.map((id) => {
              const opt = COACHING_FLAG_OPTIONS.find((o) => o.id === id);
              return opt ? (
                <span key={id} className="rounded-full bg-bg px-2.5 py-1 text-xs text-text-muted">
                  {opt.emoji} {opt.label}
                </span>
              ) : null;
            })}
          </div>
        </div>
      ) : (
        <div className="card p-5">
          <p className="eyebrow mb-3">What&apos;s going on? Pick all that apply</p>
          <div className="space-y-2">
            {COACHING_FLAG_OPTIONS.map((opt) => {
              const checked = selected.has(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleOption(opt.id)}
                  aria-pressed={checked}
                  className={
                    "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors " +
                    (checked
                      ? "border-transparent bg-text text-bg"
                      : "border-border bg-bg text-text hover:bg-accent-tint")
                  }
                >
                  <span>{opt.emoji}</span>
                  {opt.label}
                </button>
              );
            })}
          </div>

          <p className="eyebrow mb-2 mt-5">Anything else you&apos;d like to share? (optional)</p>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything else you'd like to share? (optional)"
            className="w-full resize-y rounded-2xl border border-border bg-bg px-4 py-3 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
            style={{ fontSize: "16px" }}
          />

          <button
            type="button"
            disabled={selected.size === 0}
            onClick={submit}
            className="mt-4 w-full rounded-full bg-text px-6 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            🚩 Send to Coach
          </button>
          <p className="mt-3 text-xs text-text-faint">
            You can submit one flag every two weeks, so coaches can get to everybody. Coaches
            reply within 48 hours.
          </p>
        </div>
      )}

      <div>
        <h2 className="mb-3 headline text-text">Your flag history</h2>
        <FlagHistory flags={flags} />
      </div>
    </div>
  );
}
