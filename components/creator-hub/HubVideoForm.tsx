"use client";

import { useState } from "react";
import type { HubVideo, DesiredCategory, AudioSuggestion } from "@/lib/data/types";
import { DESIRED_CATEGORIES } from "@/lib/data/types";

export interface HubVideoFormData {
  title: string;
  creatorName: string;
  originalUrl: string;
  embedUrl: string;
  desiredCategory: DesiredCategory;
  hookVariations: string[];
  formatLayers: string;
  visualElements: string[];
  executionNotes: string;
  collectionGuidance: string;
  audioSuggestions: AudioSuggestion[];
  status: "active" | "retired";
}

function StringListEditor({
  label,
  hint,
  addLabel,
  placeholder,
  items,
  onChange,
  reorderable = false,
}: {
  label: string;
  hint?: string;
  addLabel: string;
  placeholder: string;
  items: string[];
  onChange: (items: string[]) => void;
  reorderable?: boolean;
}) {
  function update(i: number, value: string) {
    onChange(items.map((it, idx) => (idx === i ? value : it)));
  }
  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div>
      <label className="eyebrow mb-1.5 block">{label}</label>
      {hint && <p className="mb-2 text-xs text-text-faint">{hint}</p>}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            {reorderable && (
              <div className="flex shrink-0 flex-col">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="text-text-faint hover:text-accent disabled:opacity-30">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 15l6-6 6 6" /></svg>
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down" className="text-text-faint hover:text-accent disabled:opacity-30">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6" /></svg>
                </button>
              </div>
            )}
            <input
              type="text"
              value={item}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
              className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
              style={{ fontSize: "16px" }}
            />
            <button type="button" onClick={() => remove(i)} aria-label="Remove" className="shrink-0 rounded-full px-2 text-lg leading-none text-text-faint hover:text-accent">
              ×
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onChange([...items, ""])} className="mt-2 text-xs font-semibold text-accent hover:underline">
        {addLabel}
      </button>
    </div>
  );
}

export default function HubVideoForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: HubVideo;
  onSave: (data: HubVideoFormData) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [creatorName, setCreatorName] = useState(initial?.creatorName ?? "");
  const [originalUrl, setOriginalUrl] = useState(initial?.originalUrl ?? "");
  const [embedUrl, setEmbedUrl] = useState(initial?.embedUrl ?? "");
  const [desiredCategory, setDesiredCategory] = useState<DesiredCategory>(
    initial?.desiredCategory ?? "Product Desire"
  );
  const [hookVariations, setHookVariations] = useState<string[]>(initial?.hookVariations ?? []);
  const [formatLayers, setFormatLayers] = useState(initial?.formatLayers ?? "");
  const [visualElements, setVisualElements] = useState<string[]>(initial?.visualElements ?? []);
  const [executionNotes, setExecutionNotes] = useState(initial?.executionNotes ?? "");
  const [collectionGuidance, setCollectionGuidance] = useState(initial?.collectionGuidance ?? "");
  const [audioSuggestions, setAudioSuggestions] = useState<AudioSuggestion[]>(
    initial?.audioSuggestions ?? []
  );
  const [status, setStatus] = useState<"active" | "retired">(initial?.status ?? "active");

  function updateAudio(i: number, patch: Partial<AudioSuggestion>) {
    setAudioSuggestions((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }
  function removeAudio(i: number) {
    setAudioSuggestions((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleSave() {
    if (!title.trim() || !creatorName.trim()) return;
    onSave({
      title: title.trim(),
      creatorName: creatorName.trim(),
      originalUrl: originalUrl.trim(),
      embedUrl: embedUrl.trim(),
      desiredCategory,
      hookVariations: hookVariations.map((h) => h.trim()).filter(Boolean),
      formatLayers: formatLayers.trim(),
      visualElements: visualElements.map((v) => v.trim()).filter(Boolean),
      executionNotes: executionNotes.trim(),
      collectionGuidance: collectionGuidance.trim(),
      audioSuggestions: audioSuggestions.filter((a) => a.label.trim() || a.url.trim()),
      status,
    });
  }

  return (
    <div className="card space-y-4 p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="eyebrow mb-1.5 block">Title / caption</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Usually the original post's caption"
            className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
            style={{ fontSize: "16px" }}
            autoFocus
          />
        </div>
        <div>
          <label className="eyebrow mb-1.5 block">Creator (&ldquo;by ___&rdquo;)</label>
          <input
            type="text"
            value={creatorName}
            onChange={(e) => setCreatorName(e.target.value)}
            placeholder="e.g. Sarah"
            className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
            style={{ fontSize: "16px" }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="eyebrow mb-1.5 block">Link to the original</label>
          <input
            type="text"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
            style={{ fontSize: "16px" }}
          />
        </div>
        <div>
          <label className="eyebrow mb-1.5 block">Embed URL (optional)</label>
          <input
            type="text"
            value={embedUrl}
            onChange={(e) => setEmbedUrl(e.target.value)}
            placeholder="Playable embed link, if different"
            className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
            style={{ fontSize: "16px" }}
          />
        </div>
      </div>

      <div>
        <label className="eyebrow mb-1.5 block">Desired category</label>
        <select
          value={desiredCategory}
          onChange={(e) => setDesiredCategory(e.target.value as DesiredCategory)}
          className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text focus:outline-none focus:ring-2 focus:ring-accent"
          style={{ fontSize: "16px" }}
        >
          {DESIRED_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <StringListEditor
        label="Hook variations"
        addLabel="+ Add a hook"
        placeholder="Alternative text hook"
        items={hookVariations}
        onChange={setHookVariations}
      />

      <div>
        <label className="eyebrow mb-1.5 block">Format &amp; emotional layers</label>
        <input
          type="text"
          value={formatLayers}
          onChange={(e) => setFormatLayers(e.target.value)}
          placeholder="e.g. Format: POV · Emotion: FOMO, Rebellion"
          className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
          style={{ fontSize: "16px" }}
        />
      </div>

      <StringListEditor
        label="Visual elements, in order"
        hint="This exact order is what the Shot List Generator pulls from."
        addLabel="+ Add a visual"
        placeholder="e.g. Collection showcase"
        items={visualElements}
        onChange={setVisualElements}
        reorderable
      />

      <div>
        <label className="eyebrow mb-1.5 block">Execution notes</label>
        <textarea
          rows={4}
          value={executionNotes}
          onChange={(e) => setExecutionNotes(e.target.value)}
          placeholder={"One per line, e.g.\n• Start on a real camera roll scroll\n• Reveal at the beat drop"}
          className="w-full resize-y rounded-xl border border-border bg-bg px-3 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
          style={{ fontSize: "16px" }}
        />
      </div>

      <div>
        <label className="eyebrow mb-1.5 block">Collection-size guidance</label>
        <textarea
          rows={2}
          value={collectionGuidance}
          onChange={(e) => setCollectionGuidance(e.target.value)}
          className="w-full resize-y rounded-xl border border-border bg-bg px-3 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
          style={{ fontSize: "16px" }}
        />
      </div>

      <div>
        <label className="eyebrow mb-1.5 block">Audio suggestions</label>
        <div className="space-y-2">
          {audioSuggestions.map((a, i) => (
            <div key={i} className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={a.label}
                onChange={(e) => updateAudio(i, { label: e.target.value })}
                placeholder="Label, e.g. Dreamy + nostalgic"
                className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
                style={{ fontSize: "16px" }}
              />
              <input
                type="text"
                value={a.url}
                onChange={(e) => updateAudio(i, { url: e.target.value })}
                placeholder="Link to the audio on the platform"
                className="min-w-0 flex-[2] rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
                style={{ fontSize: "16px" }}
              />
              <button type="button" onClick={() => removeAudio(i)} aria-label="Remove" className="shrink-0 self-start rounded-full px-2 text-lg leading-none text-text-faint hover:text-accent sm:self-center">
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setAudioSuggestions((prev) => [...prev, { label: "", url: "" }])}
          className="mt-2 text-xs font-semibold text-accent hover:underline"
        >
          + Add an audio suggestion
        </button>
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
          disabled={!title.trim() || !creatorName.trim()}
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
