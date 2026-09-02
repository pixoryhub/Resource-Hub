// Full detail for one creator — which videos they've ticked, their current
// + archived shot lists, and their full coaching flag history. Admin-only.

import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { loadProfileById, deleteProfile, toPublicCreator } from "@/lib/creatorRegistry";
import { loadCreatorActivity } from "@/lib/adminAnalytics";
import { deleteAllCreatorData } from "@/lib/creatorData";
import { getHubVideos } from "@/lib/data";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const profile = await loadProfileById(id);
    if (!profile) return NextResponse.json({ error: "No creator with that id." }, { status: 404 });

    const [activity, videos] = await Promise.all([loadCreatorActivity(id), getHubVideos()]);
    const completedIds = new Set(activity.completions.map((c) => c.videoId));

    const completedVideos = videos
      .filter((v) => completedIds.has(v.id))
      .map((v) => ({ id: v.id, position: v.position, title: v.title }));

    return NextResponse.json({
      creator: toPublicCreator(profile),
      completedVideos,
      videosTotal: videos.filter((v) => v.status === "active").length,
      currentWeek: activity.currentWeek,
      archivedWeeks: activity.archivedWeeks,
      flags: [...activity.flags].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
      lastActiveAt: activity.lastActiveAt,
    });
  } catch {
    return NextResponse.json({ error: "Couldn't reach storage — try again." }, { status: 500 });
  }
}

// Deletes the creator's profile (login) and every piece of their data
// (completions, shot lists, coaching flags) — irreversible, no undo. The
// name/PIN they used stops working immediately after this.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const profile = await loadProfileById(id);
    if (!profile) return NextResponse.json({ ok: false, error: "No creator with that id." }, { status: 404 });

    await Promise.all([deleteProfile(id), deleteAllCreatorData(id)]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Couldn't reach storage — try again." }, { status: 500 });
  }
}
