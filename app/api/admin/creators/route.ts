// Coach/admin visibility into every creator — a compact summary per
// creator for the admin dashboard list. Gated behind the same Admin mode
// password as the rest of the app's admin controls.

import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { listAllCreators } from "@/lib/creatorRegistry";
import { loadCreatorDataServer } from "@/lib/creatorData";
import { getHubVideos } from "@/lib/data";
import type { CoachingFlag } from "@/lib/data/types";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  try {
    const [creators, videos] = await Promise.all([listAllCreators(), getHubVideos()]);
    const activeVideoCount = videos.filter((v) => v.status === "active").length;

    const summaries = await Promise.all(
      creators.map(async (creator) => {
        const [completions, flags] = await Promise.all([
          loadCreatorDataServer<string[]>("completions", creator.id, []),
          loadCreatorDataServer<CoachingFlag[]>("flags", creator.id, []),
        ]);
        return {
          ...creator,
          videosCompleted: completions.length,
          videosTotal: activeVideoCount,
          openFlagCount: flags.filter((f) => f.status === "open").length,
        };
      })
    );

    return NextResponse.json({ creators: summaries });
  } catch {
    return NextResponse.json({ error: "Couldn't reach storage — try again." }, { status: 500 });
  }
}
