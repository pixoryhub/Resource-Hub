"use client";

// Top posts from last week — a leaderboard at the very top of the Creator
// Hub (not a tab, so it can't get buried, same reasoning as the Resource
// Hub's weekly opportunity spotlight). Each entry is a plain list item with
// explicit fields (creator name, platform link) — an earlier version tried
// to parse this from one pasted blob of text and kept breaking on real
// examples, so this just asks for the two things that actually vary.

import { useState } from "react";
import type { TopPost } from "@/lib/data/types";
import { useAdminMode } from "@/lib/adminMode";
import { saveContentAction } from "@/lib/adminContentClient";

const MEDALS: Record<number, { emoji: string; colour: string }> = {
  1: { emoji: "🥇", colour: "#d4a017" },
  2: { emoji: "🥈", colour: "#9ca3af" },
  3: { emoji: "🥉", colour: "#b45309" },
};

function RankBadge({ position }: { position: number }) {
  const medal = MEDALS[position];
  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold"
      style={medal ? { background: `${medal.colour}1a`, color: medal.colour } : { background: "var(--border)", color: "var(--text-muted)" }}
    >
      {medal ? medal.emoji : `#${position}`}
    </span>
  );
}

function TopPostForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: TopPost;
  onSave: (data: { views: string; creatorName: string; url: string }) => void;
  onCancel: () => void;
}) {
  const [views, setViews] = useState(initial?.views ?? "");
  const [creatorName, setCreatorName] = useState(initial?.creatorName ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");

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
      <div className="flex gap-2">
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
      </div>
    </div>
  );
}

function PostRow({
  post,
  onUpdate,
  onDelete,
  onMove,
  isFirst,
  isLast,
}: {
  post: TopPost;
  onUpdate: (data: { views: string; creatorName: string; url: string }) => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const { enabled: adminMode } = useAdminMode();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (editing) {
    return (
      <TopPostForm
        initial={post}
        onSave={(data) => {
          onUpdate(data);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="card p-3">
      <div className="flex items-center gap-3">
        <RankBadge position={post.position} />
        <a href={post.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-text">{post.views} views</p>
          <p className="truncate text-xs text-text-muted">{post.creatorName}</p>
        </a>
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-semibold text-accent hover:underline"
        >
          View ↗
        </a>
      </div>

      {adminMode && (
        <div className="mt-2 flex items-center justify-end gap-1 border-t border-border pt-2">
          <button type="button" onClick={() => onMove(-1)} disabled={isFirst} aria-label="Move up" className="flex h-7 w-7 items-center justify-center rounded-full text-text-faint hover:text-accent disabled:opacity-30">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 15l6-6 6 6" /></svg>
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={isLast} aria-label="Move down" className="flex h-7 w-7 items-center justify-center rounded-full text-text-faint hover:text-accent disabled:opacity-30">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6" /></svg>
          </button>
          <button type="button" onClick={() => setEditing(true)} className="text-xs font-semibold text-text-muted hover:text-accent">
            Edit
          </button>
          <button type="button" onClick={() => setConfirmingDelete(true)} className="text-xs font-semibold text-text-muted hover:text-accent">
            Delete
          </button>
        </div>
      )}

      {confirmingDelete && (
        <div className="mt-2 rounded-xl bg-accent-tint p-3">
          <p className="text-sm text-text">Remove {post.creatorName}&apos;s post?</p>
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
      )}
    </div>
  );
}

export default function TopPostsSection({ initial }: { initial: TopPost[] }) {
  const { enabled: adminMode } = useAdminMode();
  const [posts, setPosts] = useState(initial);
  const [adding, setAdding] = useState(false);

  if (posts.length === 0 && !adminMode) return null;

  function addPost(data: { views: string; creatorName: string; url: string }) {
    const item: TopPost = { id: `top-post-${Date.now()}`, position: posts.length + 1, ...data };
    setPosts((prev) => [...prev, item]);
    setAdding(false);
    saveContentAction("topPosts", { action: "add", item });
  }

  function updatePost(id: string, data: { views: string; creatorName: string; url: string }) {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
    saveContentAction("topPosts", { action: "update", id, patch: data });
  }

  function deletePost(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
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

  return (
    <div className="card space-y-3 p-4">
      <p className="eyebrow">🏆 Top posts from last week</p>

      {sorted.length === 0 ? (
        <p className="text-sm text-text-faint">No posts added yet.</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((post, i) => (
            <PostRow
              key={post.id}
              post={post}
              onUpdate={(data) => updatePost(post.id, data)}
              onDelete={() => deletePost(post.id)}
              onMove={(direction) => movePost(post.id, direction)}
              isFirst={i === 0}
              isLast={i === sorted.length - 1}
            />
          ))}
        </div>
      )}

      {adminMode && (
        <div>
          {adding ? (
            <TopPostForm onSave={addPost} onCancel={() => setAdding(false)} />
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="w-full rounded-2xl border border-dashed border-border py-2.5 text-sm font-semibold text-text-muted transition-colors hover:border-accent hover:text-accent"
            >
              + Add a post
            </button>
          )}
        </div>
      )}
    </div>
  );
}
