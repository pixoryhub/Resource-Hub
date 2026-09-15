"use client";

// Admin add/edit form for a Challenge (see lib/data/types.ts). One form
// for all three kinds — kind mostly changes how the creator-facing page
// renders it, not what fields exist, so it's not worth three separate
// forms drifting apart.

import { useState } from "react";
import type { Challenge, ChallengeKind } from "@/lib/data/types";
import { StringListEditor } from "@/components/creator-hub/HubVideoForm";

export interface ChallengeFormData {
  kind: ChallengeKind;
  title: string;
  description: string;
  prizeText: string;
  prizeImageUrl: string;
  criteria: string[];
  rules: string;
  cycleStart: string;
  cycleEnd: string;
  status: "active" | "retired";
}

const KIND_LABELS: Record<ChallengeKind, string> = {
  raffle: "Raffle (ties to the weekly opportunity)",
  spotlight: "Spotlight (info + prize only, no tracker)",
  featured: "Featured (the rotating \"big one\" — lock/join)",
};

export default function ChallengeForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Challenge;
  onSave: (data: ChallengeFormData) => void;
  onCancel: () => void;
}) {
  const [kind, setKind] = useState<ChallengeKind>(initial?.kind ?? "featured");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [prizeText, setPrizeText] = useState(initial?.prizeText ?? "");
  const [prizeImageUrl, setPrizeImageUrl] = useState(initial?.prizeImageUrl ?? "");
  const [criteria, setCriteria] = useState<string[]>(initial?.criteria ?? []);
  const [rules, setRules] = useState(initial?.rules ?? "");
  const [cycleStart, setCycleStart] = useState(initial?.cycleStart ?? "");
  const [cycleEnd, setCycleEnd] = useState(initial?.cycleEnd ?? "");
  const [status, setStatus] = useState<"active" | "retired">(initial?.status ?? "active");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function uploadPrizePhoto(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/images", { method: "POST", body: formData });
      const data = await res.json();
      if (data.ok) setPrizeImageUrl(data.url);
      else setUploadError(data.error ?? "Couldn't upload that image.");
    } catch {
      setUploadError("Couldn't upload that image.");
    } finally {
      setUploading(false);
    }
  }

  function handleSave() {
    if (!title.trim() || !description.trim()) return;
    onSave({
      kind,
      title: title.trim(),
      description: description.trim(),
      prizeText: prizeText.trim(),
      prizeImageUrl,
      criteria: criteria.map((c) => c.trim()).filter(Boolean),
      rules: rules.trim(),
      cycleStart,
      cycleEnd,
      status,
    });
  }

  return (
    <div className="card space-y-4 p-5">
      <div>
        <label className="eyebrow mb-1.5 block">Kind</label>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as ChallengeKind)}
          className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text focus:outline-none focus:ring-2 focus:ring-accent"
          style={{ fontSize: "16px" }}
        >
          {(Object.keys(KIND_LABELS) as ChallengeKind[]).map((k) => (
            <option key={k} value={k}>
              {KIND_LABELS[k]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="eyebrow mb-1.5 block">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Bestie-Goals Challenge"
          className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
          style={{ fontSize: "16px" }}
          autoFocus
        />
      </div>

      <div>
        <label className="eyebrow mb-1.5 block">Description</label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What creators need to do, in a sentence or two"
          className="w-full resize-y rounded-xl border border-border bg-bg px-3 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
          style={{ fontSize: "16px" }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="eyebrow mb-1.5 block">Cycle starts</label>
          <input
            type="date"
            value={cycleStart}
            onChange={(e) => setCycleStart(e.target.value)}
            className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text focus:outline-none focus:ring-2 focus:ring-accent"
            style={{ fontSize: "16px" }}
          />
        </div>
        <div>
          <label className="eyebrow mb-1.5 block">Cycle ends</label>
          <input
            type="date"
            value={cycleEnd}
            onChange={(e) => setCycleEnd(e.target.value)}
            className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text focus:outline-none focus:ring-2 focus:ring-accent"
            style={{ fontSize: "16px" }}
          />
        </div>
      </div>

      <div>
        <label className="eyebrow mb-1.5 block">Prize</label>
        <input
          type="text"
          value={prizeText}
          onChange={(e) => setPrizeText(e.target.value)}
          placeholder="e.g. $150 cash, or Ring light + $75"
          className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
          style={{ fontSize: "16px" }}
        />
      </div>

      <div>
        <label className="eyebrow mb-1.5 block">Prize photo (optional)</label>
        {prizeImageUrl ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded/external image, not a local/optimizable asset */}
            <img src={prizeImageUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => setPrizeImageUrl("")}
              className="text-xs font-semibold text-text-muted hover:text-accent"
            >
              Remove
            </button>
          </div>
        ) : (
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-accent hover:underline">
            {uploading ? "Uploading…" : "Upload a photo of the prize"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadPrizePhoto(file);
                e.target.value = "";
              }}
            />
          </label>
        )}
        {uploadError && <p className="mt-1.5 text-xs text-accent">{uploadError}</p>}
      </div>

      <StringListEditor
        label="Qualifying criteria (optional)"
        hint="A short, trackable checklist — shown up front, before the full rules below."
        addLabel="+ Add a criterion"
        placeholder='e.g. Uses the "bestie goals" hook or a close variation'
        items={criteria}
        onChange={setCriteria}
        reorderable
      />

      <div>
        <label className="eyebrow mb-1.5 block">Full rules (optional)</label>
        <textarea
          rows={5}
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          placeholder={"As much detail as you need, one point per line — shown under a \"Full rules\" toggle."}
          className="w-full resize-y rounded-xl border border-border bg-bg px-3 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
          style={{ fontSize: "16px" }}
        />
      </div>

      <div>
        <label className="eyebrow mb-1.5 block">Status</label>
        <div className="flex gap-1 rounded-full border border-border bg-bg p-1 sm:w-fit">
          {(["active", "retired"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={
                "flex-1 rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-colors sm:flex-none " +
                (status === s ? "bg-text text-bg" : "text-text-muted hover:bg-accent-tint")
              }
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={!title.trim() || !description.trim()}
          className="rounded-full bg-text px-5 py-2 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-text-muted transition-colors hover:bg-surface"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
