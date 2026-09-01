import type { Week } from "./data/types";

export interface ShotListSummary {
  blueprintOpportunityCount: number;
  hubVideoCount: number;
  rawShotCount: number; // sum of opportunity tags across all shots — "shots between them"
  visualCount: number; // deduped shot count — "visuals to film"
  groupCount: number; // "setups"
  sharedShotCount: number; // shots tagged by more than one opportunity/video
  filmedCount: number;
  totalCount: number;
}

export function summarizeWeek(week: Week): ShotListSummary {
  const blueprintOpportunityCount = week.opportunities.filter(
    (o) => o.source === "blueprint"
  ).length;
  const hubVideoCount = week.opportunities.filter((o) => o.source === "creator_hub").length;

  let rawShotCount = 0;
  let sharedShotCount = 0;
  let filmedCount = 0;
  for (const shot of week.shots) {
    rawShotCount += shot.opportunityTags.length;
    if (shot.opportunityTags.length > 1) sharedShotCount++;
    if (shot.filmed) filmedCount++;
  }

  return {
    blueprintOpportunityCount,
    hubVideoCount,
    rawShotCount,
    visualCount: week.shots.length,
    groupCount: week.groups.length,
    sharedShotCount,
    filmedCount,
    totalCount: week.shots.length,
  };
}

// The result summary sentence — §7.4. Bolding is left to the caller (JSX).
export function summarySentenceParts(s: ShotListSummary) {
  const parts: string[] = [];
  if (s.blueprintOpportunityCount > 0) {
    parts.push(
      `${s.blueprintOpportunityCount} Blueprint ${s.blueprintOpportunityCount === 1 ? "opportunity" : "opportunities"}`
    );
  }
  if (s.hubVideoCount > 0) {
    parts.push(`${s.hubVideoCount} Hub ${s.hubVideoCount === 1 ? "video" : "videos"}`);
  }
  const found = parts.length ? parts.join(" and ") : "0 opportunities";

  return {
    found,
    rawShotCount: s.rawShotCount,
    visualCount: s.visualCount,
    groupCount: s.groupCount,
    sharedLine:
      s.sharedShotCount > 0
        ? `${s.sharedShotCount} ${s.sharedShotCount === 1 ? "shot is" : "shots are"} needed more than once. Film ${s.sharedShotCount === 1 ? "it" : "them"} first.`
        : null,
  };
}
