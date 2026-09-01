// Program-wide coach dashboard — KPI totals, an 8-week activity chart
// (video completions, shots filmed, coaching flags submitted), a
// "needs attention" list (inactive creators / overdue flags), and a
// most-active-this-week list. Admin-only.

import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { listAllCreators } from "@/lib/creatorRegistry";
import { loadCreatorActivity, mondayOf, lastNWeekStarts } from "@/lib/adminAnalytics";
import { getHubVideos } from "@/lib/data";

const WEEKS_BACK = 8;
const INACTIVE_DAYS_THRESHOLD = 7;
const FLAG_OVERDUE_HOURS = 48;

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  try {
    const [creators, videos] = await Promise.all([listAllCreators(), getHubVideos()]);
    const activeVideoTotal = videos.filter((v) => v.status === "active").length;

    const perCreator = await Promise.all(
      creators.map(async (creator) => ({ creator, activity: await loadCreatorActivity(creator.id) }))
    );

    const now = new Date();
    const weekKeys = lastNWeekStarts(WEEKS_BACK, now);
    const currentWeekKey = weekKeys[weekKeys.length - 1];
    const weekly = new Map(weekKeys.map((w) => [w, { weekStart: w, completions: 0, shotsFilmed: 0, flagsSubmitted: 0 }]));

    let totalCompletions = 0;
    let totalShotsFilmed = 0;
    let openFlagCount = 0;

    const needsAttention: { id: string; firstName: string; lastName: string; reason: string }[] = [];
    const activityCountThisWeek = new Map<string, number>();

    for (const { creator, activity } of perCreator) {
      totalCompletions += activity.completions.length;
      totalShotsFilmed += activity.filmedShotCount;
      openFlagCount += activity.flags.filter((f) => f.status === "open").length;

      for (const event of activity.events) {
        const weekKey = mondayOf(event.at);
        const bucket = weekly.get(weekKey);
        if (!bucket) continue; // older than the chart's window
        if (event.type === "completion") bucket.completions++;
        if (event.type === "shot") bucket.shotsFilmed++;
        if (event.type === "flag") bucket.flagsSubmitted++;
        if (weekKey === currentWeekKey) {
          activityCountThisWeek.set(creator.id, (activityCountThisWeek.get(creator.id) ?? 0) + 1);
        }
      }

      const daysSinceActive = activity.lastActiveAt
        ? (now.getTime() - new Date(activity.lastActiveAt).getTime()) / 86_400_000
        : null;
      if (daysSinceActive === null || daysSinceActive >= INACTIVE_DAYS_THRESHOLD) {
        needsAttention.push({
          id: creator.id,
          firstName: creator.firstName,
          lastName: creator.lastName,
          reason: daysSinceActive === null ? "No activity recorded yet" : `Inactive ${Math.floor(daysSinceActive)} days`,
        });
      }

      for (const flag of activity.flags) {
        if (flag.status !== "open") continue;
        const hoursOpen = (now.getTime() - new Date(flag.submittedAt).getTime()) / 3_600_000;
        if (hoursOpen >= FLAG_OVERDUE_HOURS) {
          needsAttention.push({
            id: creator.id,
            firstName: creator.firstName,
            lastName: creator.lastName,
            reason: `Coaching flag overdue (open ${Math.floor(hoursOpen / 24)}d)`,
          });
        }
      }
    }

    const mostActive = perCreator
      .map(({ creator }) => ({ ...creator, activityCount: activityCountThisWeek.get(creator.id) ?? 0 }))
      .filter((c) => c.activityCount > 0)
      .sort((a, b) => b.activityCount - a.activityCount)
      .slice(0, 5);

    return NextResponse.json({
      kpis: {
        totalCreators: creators.length,
        totalCompletions,
        totalShotsFilmed,
        openFlagCount,
        videosTotal: activeVideoTotal,
      },
      weekly: weekKeys.map((w) => weekly.get(w)),
      needsAttention,
      mostActive,
    });
  } catch {
    return NextResponse.json({ error: "Couldn't reach storage — try again." }, { status: 500 });
  }
}
