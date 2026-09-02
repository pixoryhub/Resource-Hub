// Program-wide coach dashboard — KPI totals, an 8-week activity chart
// (video completions, shots filmed, coaching flags submitted), a
// "needs attention" list (inactive creators / overdue flags), and a
// most-active-this-week list. Admin-only.

import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { listAllCreators } from "@/lib/creatorRegistry";
import { loadCreatorActivity, mondayOf, lastNWeekStarts } from "@/lib/adminAnalytics";
import { loadCreatorDataServer } from "@/lib/creatorData";
import { getHubVideos, getWeeklyOpportunity } from "@/lib/data";

const WEEKS_BACK = 8;
const INACTIVE_DAYS_THRESHOLD = 7;
const FLAG_OVERDUE_HOURS = 48;
const TOP_VIDEOS_LIMIT = 5;
const NEEDS_PUSH_LIMIT = 5;

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  try {
    const [creators, videos, weeklyOpportunity] = await Promise.all([
      listAllCreators(),
      getHubVideos(),
      getWeeklyOpportunity(),
    ]);
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
    const completionsByVideoId = new Map<string, number>();

    for (const { creator, activity } of perCreator) {
      totalCompletions += activity.completions.length;
      totalShotsFilmed += activity.filmedShotCount;
      openFlagCount += activity.flags.filter((f) => f.status === "open").length;

      for (const c of activity.completions) {
        completionsByVideoId.set(c.videoId, (completionsByVideoId.get(c.videoId) ?? 0) + 1);
      }

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

    // Weekly active creators — anyone with at least one action this week.
    const weeklyActiveCreators = activityCountThisWeek.size;

    // New signups this week — creators predating the createdAt field just
    // won't count, same "unknown, not zero" treatment as elsewhere.
    const currentWeekStart = new Date(currentWeekKey);
    const newSignupsThisWeek = creators.filter(
      (c) => c.createdAt && new Date(c.createdAt) >= currentWeekStart
    ).length;

    // Active videos only — a retired video showing up as "needs a push" would be noise, not signal.
    const activeVideos = videos.filter((v) => v.status === "active");

    // Completion rate by desired category — the data behind the "keep a
    // healthy mix of categories" advice creators already get, made visible
    // for the program as a whole.
    const completionsByCategory = new Map<string, number>();
    const videosByCategory = new Map<string, number>();
    for (const v of activeVideos) {
      videosByCategory.set(v.desiredCategory, (videosByCategory.get(v.desiredCategory) ?? 0) + 1);
    }
    for (const [videoId, count] of completionsByVideoId) {
      const video = activeVideos.find((v) => v.id === videoId);
      if (!video) continue;
      completionsByCategory.set(video.desiredCategory, (completionsByCategory.get(video.desiredCategory) ?? 0) + count);
    }
    const categoryBreakdown = [...videosByCategory.keys()]
      .map((category) => ({
        category,
        completions: completionsByCategory.get(category) ?? 0,
        videoCount: videosByCategory.get(category) ?? 0,
      }))
      .sort((a, b) => b.completions - a.completions);

    const videoStats = activeVideos.map((v) => ({
      id: v.id,
      position: v.position,
      title: v.title,
      completions: completionsByVideoId.get(v.id) ?? 0,
    }));

    // Zero cross-offs isn't a "top" video, no matter how it sorts — that's
    // a "needs a push" video wearing the wrong badge.
    const topVideos = [...videoStats]
      .filter((v) => v.completions > 0)
      .sort((a, b) => b.completions - a.completions || a.position - b.position)
      .slice(0, TOP_VIDEOS_LIMIT);

    // Least crossed-off first — ties broken by position so it reads in a stable, familiar order.
    const needsPush = [...videoStats]
      .sort((a, b) => a.completions - b.completions || a.position - b.position)
      .slice(0, NEEDS_PUSH_LIMIT);

    // Who's marked this week's opportunity done — "this week's" meaning
    // whatever's live right now, identified by its updatedAt (a fresh post
    // gets a fresh one, so marks from a previous opportunity don't carry
    // over and look like they applied to a new one).
    let opportunityMarkedDone: { id: string; firstName: string; lastName: string }[] = [];
    if (weeklyOpportunity) {
      const records = await Promise.all(
        creators.map(async (creator) => ({
          creator,
          record: await loadCreatorDataServer<{ updatedAt: string } | null>("opportunity-completion", creator.id, null),
        }))
      );
      opportunityMarkedDone = records
        .filter(({ record }) => record?.updatedAt === weeklyOpportunity.updatedAt)
        .map(({ creator }) => ({ id: creator.id, firstName: creator.firstName, lastName: creator.lastName }));
    }

    return NextResponse.json({
      kpis: {
        totalCreators: creators.length,
        totalCompletions,
        totalShotsFilmed,
        openFlagCount,
        videosTotal: activeVideoTotal,
        weeklyActiveCreators,
        newSignupsThisWeek,
        opportunityMarkedDoneCount: opportunityMarkedDone.length,
      },
      weekly: weekKeys.map((w) => weekly.get(w)),
      needsAttention,
      mostActive,
      topVideos,
      needsPush,
      categoryBreakdown,
      opportunityMarkedDone,
      hasWeeklyOpportunity: !!weeklyOpportunity,
    });
  } catch {
    return NextResponse.json({ error: "Couldn't reach storage — try again." }, { status: 500 });
  }
}
