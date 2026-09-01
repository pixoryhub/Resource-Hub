// Full detail for one creator — which videos they've ticked, their current
// + archived shot lists, and their full coaching flag history. Admin-only.

import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { loadProfileById, toPublicCreator } from "@/lib/creatorRegistry";
import { loadCreatorActivity } from "@/lib/adminAnalytics";
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
