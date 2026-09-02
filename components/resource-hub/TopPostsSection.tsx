"use client";

// Top posts from last week — same idea as WeeklyOpportunitySection (one
// title field + one paste box, not a form per post), placed right below it
// for the same reason: not a tab, so it can't get buried. The team already
// writes this as one line per post — rank marker, view count, @handle,
// link — so the parser matches that line shape directly instead of asking
// for four separate fields per post.

import { useState } from "react";
import type { TopPosts } from "@/lib/data/types";
import { useAdminMode } from "@/lib/adminMode";
import { saveContentAction } from "@/lib/adminContentClient";

interface PostLine {
  marker: string;
  stat: string;
  handle: string;
  url: string;
}

// Handles two shapes, since both show up in practice:
//   "🥇 540K @elizabeth  https://www.instagram.com/reel/DcZgUCwSQCr/"  (one line)
//   "🥇 540K Elizabeth" then "https://www.instagram.com/reel/..." on the next line
// The handle isn't assumed to be one space-free token or "@"-prefixed —
// "@Holly F" and "Holly F" are both real examples — so it's whatever sits
// between the stat and the URL, however many words that is. Kept generic
// on the marker itself so a 4th/5th place using "4." or another emoji
// still parses the same way.
const ONE_LINE_POST = /^(\S+)\s+(\S+)\s+(.+?)\s+(https?:\/\/\S+)\s*$/;
const INFO_LINE = /^(\S+)\s+(\S+)\s+(.+)$/;
const URL_LINE = /^https?:\/\/\S+$/;

function parsePosts(body: string): { posts: PostLine[]; extraLines: string[] } {
  const lines = body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const posts: PostLine[] = [];
  const extraLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const oneLine = line.match(ONE_LINE_POST);
    if (oneLine) {
      const [, marker, stat, handle, url] = oneLine;
      posts.push({ marker, stat, handle, url });
      continue;
    }

    const info = line.match(INFO_LINE);
    const next = lines[i + 1];
    if (info && !URL_LINE.test(info[3]) && next && URL_LINE.test(next)) {
      const [, marker, stat, handle] = info;
      posts.push({ marker, stat, handle, url: next });
      i++; // this line's URL was on the next line — don't process it again
      continue;
    }

    extraLines.push(line);
  }

  return { posts, extraLines };
}

const MEDAL_COLOURS: Record<string, string> = {
  "🥇": "#d4a017",
  "🥈": "#9ca3af",
  "🥉": "#b45309",
};

function PostRow({ post }: { post: PostLine }) {
  const colour = MEDAL_COLOURS[post.marker];
  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="card card-hover flex items-center gap-3 p-3"
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
        style={{ background: colour ? `${colour}1a` : "var(--border)" }}
      >
        {post.marker}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-text">{post.stat} views</p>
        <p className="truncate text-xs text-text-muted">{post.handle}</p>
      </div>
      <span className="shrink-0 text-xs font-semibold text-accent">View ↗</span>
    </a>
  );
}

function TopPostsForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: TopPosts | null;
  onSave: (value: TopPosts) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "Top posts from last week");
  const [body, setBody] = useState(initial?.body ?? "");
  const [active, setActive] = useState(initial?.active ?? true);

  function handleSave() {
    if (!title.trim() || !body.trim()) return;
    onSave({ title: title.trim(), body: body.trim(), active, updatedAt: new Date().toISOString() });
  }

  return (
    <div className="card space-y-3 p-5">
      <p className="eyebrow">Top posts from last week</p>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Top posts from last week"
        className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
        style={{ fontSize: "16px" }}
        autoFocus
      />
      <textarea
        rows={6}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={"🥇 540K @elizabeth  https://www.instagram.com/reel/DcZgUCwSQCr/\n🥈 285K @Holly F  https://www.instagram.com/reel/DceIG6GoGOa/\n🥉 108K @Happylifesuz  https://www.instagram.com/reel/DckShuisYCd/"}
        className="w-full resize-y rounded-xl border border-border bg-bg px-3 py-2.5 font-mono text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
        style={{ fontSize: "16px" }}
      />
      <p className="text-xs text-text-faint">
        One post per line: rank marker, view count, @handle, then the link — same shape as usual.
      </p>
      <label className="flex items-center gap-2 text-sm font-medium text-text">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4" />
        Live on the Resource Hub
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!title.trim() || !body.trim()}
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

export default function TopPostsSection({ initial }: { initial: TopPosts | null }) {
  const { enabled: adminMode } = useAdminMode();
  const [topPosts, setTopPosts] = useState(initial);
  const [editing, setEditing] = useState(false);

  function handleSave(value: TopPosts) {
    setTopPosts(value);
    setEditing(false);
    saveContentAction("topPosts", { action: "save", value });
  }

  if (editing) {
    return <TopPostsForm initial={topPosts} onSave={handleSave} onCancel={() => setEditing(false)} />;
  }

  if (!topPosts || !topPosts.active) {
    if (!adminMode) return null;
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="w-full rounded-2xl border border-dashed border-border py-6 text-sm font-semibold text-text-muted transition-colors hover:border-accent hover:text-accent"
      >
        + Add last week&apos;s top posts
      </button>
    );
  }

  const { posts, extraLines } = parsePosts(topPosts.body);

  return (
    <div className="card relative space-y-3 p-5">
      {adminMode && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-text-faint transition-colors hover:text-accent"
          aria-label="Edit top posts"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>
      )}

      <div>
        <p className="eyebrow mb-1">🏆 Leaderboard</p>
        <h2 className="headline pr-8 text-text">{topPosts.title}</h2>
      </div>

      {posts.length > 0 ? (
        <div className="space-y-2">
          {posts.map((post, i) => (
            <PostRow key={i} post={post} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-faint">Nothing parsed yet — check the format in edit mode.</p>
      )}

      {extraLines.length > 0 && (
        <div className="space-y-1 border-t border-border pt-3">
          {extraLines.map((line, i) => (
            <p key={i} className="text-xs text-text-muted">
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
