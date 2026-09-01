// Full detail for one creator — which videos they've ticked, their current
// + archived shot lists, and their full coaching flag history. Admin-only.

import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { loadProfileById, toPublicCreator } from "@/lib/creatorRegistry";
import { loadCreatorDataServer } from "@/lib/creatorData";
import { getHubVideos } from "@/lib/data";
import type { CoachingFlag, Week } from "@/lib/data/types";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const profile = await loadProfileById(id);
    if (!profile) return NextResponse.json({ error: "No creator with that id." }, { status: 404 });

    const [completions, videos, currentWeek, archivedWeeks, flags] = await Promise.all([
      loadCreatorDataServer<string[]>("completions", id, []),
      getHubVideos(),
      loadCreatorDataServer<Week | null>("shotlist-week", id, null),
      loadCreatorDataServer<Week[]>("shotlist-archived", id, []),
      loadCreatorDataServer<CoachingFlag[]>("flags", id, []),
    ]);

    const completedVideos = videos
      .filter((v) => completions.includes(v.id))
      .map((v) => ({ id: v.id, position: v.position, title: v.title }));

    return NextResponse.json({
      creator: toPublicCreator(profile),
      completedVideos,
      videosTotal: videos.filter((v) => v.status === "active").length,
      currentWeek,
      archivedWeeks,
      flags: [...flags].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    });
  } catch {
    return NextResponse.json({ error: "Couldn't reach storage — try again." }, { status: 500 });
  }
}
