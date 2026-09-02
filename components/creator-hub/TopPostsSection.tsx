"use client";

// Top posts from last week — a compact row of medal circles at the very
// top of the Creator Hub (not a tab, so it can't get buried, same
// reasoning as the Resource Hub's weekly opportunity spotlight). Kept
// small and horizontal on purpose — an earlier full-width stacked-card
// version read as cluttered and didn't stand out. Each entry is a plain
// list item with explicit fields (creator name, platform link) — an even
// earlier version tried to parse this from one pasted blob of text and
// kept breaking on real examples, so this just asks for the two things
// that actually vary.

import { useState } from "react";
import type { TopPost } from "@/lib/data/types";
import { useAdminMode } from "@/lib/adminMode";
import { saveContentAction } from "@/lib/adminContentClient";

const MEDALS: Record<number, { emoji: string; colour: string }> = {
  1: { emoji: "🥇", colour: "#d4a017" },
  2: { emoji: "🥈", colour: "#9ca3af" },
  3: { emoji: "🥉", colour: "#b45309" },
};

function TopPostForm({
  initial,
  onSave,
  onDelete,
  onCancel,
}: {
  initial?: TopPost;
  onSave: (data: { views: string; creatorName: string; url: string }) => void;
  onDelete?: () => void;
  onCancel: () => void;
}) {
  const [views, setViews] = useState(initial?.views ?? "");
  const [creatorName, setCreatorName] = useState(initial?.creatorName ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleSave() {
    if (!views.trim() || !creatorName.trim() || !url.trim()) return;
    onSave({ views: views.trim(), creatorName: creatorName.trim(), url: url.trim() });
  }

  return (
    <div className="card space-y-3 p-4">
      <div>
        <label className="eyebrow mb-1.5 block">Views</label>
        <input
          type="text"
          value={views}
          onChange={(e) => setViews(e.target.value)}
          placeholder="540K"
          className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
          style={{ fontSize: "16px" }}
          autoFocus
        />
      </div>
      <div>
        <label className="eyebrow mb-1.5 block">Creator name</label>
        <input
          type="text"
          value={creatorName}
          onChange={(e) => setCreatorName(e.target.value)}
          placeholder="Elizabeth"
          className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
          style={{ fontSize: "16px" }}
        />
      </div>
      <div>
        <label className="eyebrow mb-1.5 block">Platform link</label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.instagram.com/reel/..."
          className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
          style={{ fontSize: "16px" }}
        />
      </div>

      {confirmingDelete ? (
        <div className="rounded-xl bg-accent-tint p-3">
          <p className="text-sm text-text">Remove this post?</p>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={onDelete} className="rounded-full bg-text px-4 py-1.5 text-xs font-semibold text-bg">
              Delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-text-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={!views.trim() || !creatorName.trim() || !url.trim()}
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
          {onDelete && (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="ml-auto text-xs font-semibold text-text-faint hover:text-accent"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MedalCircle({
  post,
  adminMode,
  onEdit,
  onMove,
  isFirst,
  isLast,
}: {
  post: TopPost;
  adminMode: boolean;
  onEdit: () => void;
  onMove: (direction: -1 | 1) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const medal = MEDALS[post.position];
  const circle = (
    <span
      className="flex h-14 w-14 items-center justify-center rounded-full text-2xl shadow-sm transition-transform group-hover:scale-105"
      style={medal ? { background: `${medal.colour}1a` } : { background: "var(--border)" }}
    >
      {medal ? medal.emoji : `#${post.position}`}
    </span>
  );

  return (
    <div className="flex shrink-0 flex-col items-center gap-1" style={{ width: 76 }}>
      <div className="relative">
        {adminMode ? (
          <button type="button" onClick={onEdit} className="group" aria-label={`Edit ${post.creatorName}'s post`}>
            {circle}
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface text-text-faint shadow-sm">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </span>
          </button>
        ) : (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
            aria-label={`View ${post.creatorName}'s post — ${post.views} views`}
          >
            {circle}
          </a>
        )}
      </div>
      <p className="max-w-full truncate text-[11px] font-semibold text-text">{post.views}</p>
      <p className="max-w-full truncate text-[10px] text-text-faint">{post.creatorName}</p>
      {adminMode && (
        <div className="flex gap-0.5">
          <button type="button" onClick={() => onMove(-1)} disabled={isFirst} aria-label="Move up" className="flex h-5 w-5 items-center justify-center rounded-full text-text-faint hover:text-accent disabled:opacity-20">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 15l6-6 6 6" /></svg>
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={isLast} aria-label="Move down" className="flex h-5 w-5 items-center justify-center rounded-full text-text-faint hover:text-accent disabled:opacity-20">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default function TopPostsSection({ initial }: { initial: TopPost[] }) {
  const { enabled: adminMode } = useAdminMode();
  const [posts, setPosts] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (posts.length === 0 && !adminMode) return null;

  function addPost(data: { views: string; creatorName: string; url: string }) {
    const item: TopPost = { id: `top-post-${Date.now()}`, position: posts.length + 1, ...data };
    setPosts((prev) => [...prev, item]);
    setAdding(false);
    saveContentAction("topPosts", { action: "add", item });
  }

  function updatePost(id: string, data: { views: string; creatorName: string; url: string }) {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
    setEditingId(null);
    saveContentAction("topPosts", { action: "update", id, patch: data });
  }

  function deletePost(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setEditingId(null);
    saveContentAction("topPosts", { action: "delete", id });
  }

  function movePost(id: string, direction: -1 | 1) {
    const sorted = [...posts].sort((a, b) => a.position - b.position);
    const i = sorted.findIndex((p) => p.id === id);
    const j = i + direction;
    if (i === -1 || j < 0 || j >= sorted.length) return;
    const a = sorted[i];
    const b = sorted[j];
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === a.id) return { ...p, position: b.position };
        if (p.id === b.id) return { ...p, position: a.position };
        return p;
      })
    );
    saveContentAction("topPosts", {
      action: "reorder",
      positions: [
        { id: a.id, position: b.position },
        { id: b.id, position: a.position },
      ],
    });
  }

  const sorted = [...posts].sort((a, b) => a.position - b.position);
  const editingPost = sorted.find((p) => p.id === editingId);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-text-faint">🏆 Last week</span>
        {sorted.map((post, i) => (
          <MedalCircle
            key={post.id}
            post={post}
            adminMode={adminMode}
            onEdit={() => setEditingId(post.id)}
            onMove={(direction) => movePost(post.id, direction)}
            isFirst={i === 0}
            isLast={i === sorted.length - 1}
          />
        ))}
        {adminMode && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            aria-label="Add a post"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-text-faint transition-colors hover:border-accent hover:text-accent"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </button>
        )}
      </div>

      {editingPost && (
        <TopPostForm
          initial={editingPost}
          onSave={(data) => updatePost(editingPost.id, data)}
          onDelete={() => deletePost(editingPost.id)}
          onCancel={() => setEditingId(null)}
        />
      )}

      {adding && <TopPostForm onSave={addPost} onCancel={() => setAdding(false)} />}
    </div>
  );
}
