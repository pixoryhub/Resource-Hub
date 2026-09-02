"use client";

import { useState } from "react";
import type { CalendarEvent } from "@/lib/data/types";
import { useAdminMode } from "@/lib/adminMode";
import { saveContentAction } from "@/lib/adminContentClient";

// The team works across Central Time and the UK — showing both avoids the
// "which timezone did they mean" back-and-forth. IANA zone names handle
// daylight saving automatically, so this stays correct year-round without
// needing to track CST/CDT or GMT/BST by hand.
function formatEventDate(iso: string) {
  const date = new Date(iso);
  const dateLabel = date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const ct = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" });
  const uk = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
  return `${dateLabel} · ${ct} CT / ${uk} UK`;
}

// datetime-local gives "2026-09-05T19:00" (no seconds/zone) — good enough here.
function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function EventForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: CalendarEvent;
  onSave: (data: { title: string; startsAt: string; rsvpUrl: string }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [startsAt, setStartsAt] = useState(
    initial ? toDatetimeLocal(initial.startsAt) : ""
  );
  const [rsvpUrl, setRsvpUrl] = useState(initial?.rsvpUrl ?? "");

  function handleSave() {
    if (!title.trim() || !startsAt) return;
    onSave({ title: title.trim(), startsAt: new Date(startsAt).toISOString(), rsvpUrl: rsvpUrl.trim() });
  }

  return (
    <div className="card space-y-3 p-4">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Event title"
        className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
        style={{ fontSize: "16px" }}
        autoFocus
      />
      <input
        type="datetime-local"
        value={startsAt}
        onChange={(e) => setStartsAt(e.target.value)}
        className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text focus:outline-none focus:ring-2 focus:ring-accent"
        style={{ fontSize: "16px" }}
      />
      <input
        type="text"
        value={rsvpUrl}
        onChange={(e) => setRsvpUrl(e.target.value)}
        placeholder="RSVP link"
        className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
        style={{ fontSize: "16px" }}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!title.trim() || !startsAt}
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

export default function EventsSection({ initialEvents }: { initialEvents: CalendarEvent[] }) {
  const { enabled: adminMode } = useAdminMode();
  const [events, setEvents] = useState(initialEvents);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function addEvent(data: { title: string; startsAt: string; rsvpUrl: string }) {
    const event: CalendarEvent = { id: `event-${Date.now()}`, ...data };
    setEvents((prev) => [...prev, event].sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
    setAdding(false);
    saveContentAction("events", { action: "add", item: event });
  }

  function updateEvent(id: string, data: { title: string; startsAt: string; rsvpUrl: string }) {
    setEvents((prev) =>
      prev
        .map((e) => (e.id === id ? { ...e, ...data } : e))
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    );
    setEditingId(null);
    saveContentAction("events", { action: "update", id, patch: data });
  }

  function deleteEvent(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    saveContentAction("events", { action: "delete", id });
  }

  return (
    <div className="space-y-3">
      {events.length === 0 && !adding && (
        <p className="text-sm text-text-faint">Nothing scheduled yet.</p>
      )}

      {events.map((e) =>
        editingId === e.id ? (
          <EventForm
            key={e.id}
            initial={e}
            onSave={(data) => updateEvent(e.id, data)}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div key={e.id} className="card flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold text-text">{e.title}</p>
              <p className="text-sm text-text-muted">{formatEventDate(e.startsAt)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <a
                href={e.rsvpUrl || "#"}
                className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-text transition-colors hover:bg-accent-tint"
              >
                RSVP
              </a>
              {adminMode && (
                <>
                  <button
                    type="button"
                    onClick={() => setEditingId(e.id)}
                    aria-label="Edit"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-text-faint hover:text-accent"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteEvent(e.id)}
                    aria-label="Delete"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-text-faint hover:text-accent"
                  >
                    ×
                  </button>
                </>
              )}
            </div>
          </div>
        )
      )}

      {adminMode &&
        (adding ? (
          <EventForm onSave={addEvent} onCancel={() => setAdding(false)} />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="w-full rounded-2xl border border-dashed border-border py-3 text-sm font-semibold text-text-muted transition-colors hover:border-accent hover:text-accent"
          >
            + Add an event
          </button>
        ))}
    </div>
  );
}
