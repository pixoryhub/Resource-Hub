// Coach/admin visibility into every creator — a compact summary per
// creator for the admin dashboard list. Gated behind the same Admin mode
// password as the rest of the app's admin controls.

import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { listAllCreators } from "@/lib/creatorRegistry";
import { loadCreatorActivity } from "@/lib/adminAnalytics";
import { getHubVideos } from "@/lib/data";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  try {
    const [creators, videos] = await Promise.all([listAllCreators(), getHubVideos()]);
    const activeVideoCount = videos.filter((v) => v.status === "active").length;

    const summaries = await Promise.all(
      creators.map(async (creator) => {
        const activity = await loadCreatorActivity(creator.id);
        return {
          ...creator,
          videosCompleted: activity.completions.length,
          videosTotal: activeVideoCount,
          openFlagCount: activity.flags.filter((f) => f.status === "open").length,
          lastActiveAt: activity.lastActiveAt,
        };
      })
    );

    return NextResponse.json({ creators: summaries });
  } catch {
    return NextResponse.json({ error: "Couldn't reach storage — try again." }, { status: 500 });
  }
}
