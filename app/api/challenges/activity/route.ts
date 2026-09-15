// Cross-creator challenge stats — entrant counts per challenge and a
// recent-activity feed. Public, same trust level as the Top Posts
// leaderboard already shown to everyone on the Resource Hub (real first
// names, no admin gate) — this isn't a bigger privacy step than that.

import { NextResponse } from "next/server";
import { listAllCreators } from "@/lib/creatorRegistry";
import { loadCreatorDataServer } from "@/lib/creatorData";
import { getChallenges, getWeeklyOpportunity } from "@/lib/data";

interface RecreationLink {
  url: string;
  submittedAt: string;
}

// Recreation links briefly shipped as a single {url, submittedAt} value
// before becoming a list — same fallback used elsewhere (see
// lib/recreationViewCounts.ts) so old-shape records don't crash this.
function normalizeLinks(raw: RecreationLink[] | RecreationLink | null | undefined): RecreationLink[] {
  if (Array.isArray(raw)) return raw;
  return raw ? [raw] : [];
}

interface FeedEntry {
  label: string;
  firstName: string;
  lastName: string;
  at: string;
}

export async function GET() {
  try {
    const [creators, challenges, weeklyOpportunity] = await Promise.all([
      listAllCreators(),
      getChallenges(),
      getWeeklyOpportunity(),
    ]);

    const entrantCounts: Record<string, number> = {};
    const feed: FeedEntry[] = [];

    await Promise.all(
      creators.map(async (creator) => {
        const [hubLinks, oppLinksRaw, oppDone] = await Promise.all([
          loadCreatorDataServer<Record<string, RecreationLink[] | RecreationLink>>("recreation-links", creator.id, {}),
          loadCreatorDataServer<RecreationLink[] | RecreationLink | null>(
            "recreation-link-weekly-opportunity",
            creator.id,
            null
          ),
          loadCreatorDataServer<{ updatedAt: string } | null>("opportunity-completion", creator.id, null),
        ]);

        // Featured-challenge links live under "challenge:{id}" keys in the
        // same map hub videos use — same store, different key namespace.
        for (const [key, links] of Object.entries(hubLinks)) {
          if (!key.startsWith("challenge:")) continue;
          const challengeId = key.slice("challenge:".length);
          const entries = normalizeLinks(links);
          if (entries.length === 0) continue;
          entrantCounts[challengeId] = (entrantCounts[challengeId] ?? 0) + 1;
          const challenge = challenges.find((c) => c.id === challengeId);
          for (const link of entries) {
            feed.push({
              label: `linked ${challenge ? `"${challenge.title}"` : "a challenge"} entry`,
              firstName: creator.firstName,
              lastName: creator.lastName,
              at: link.submittedAt,
            });
          }
        }

        const oppLinks = normalizeLinks(oppLinksRaw);
        for (const link of oppLinks) {
          feed.push({
            label: "earned a raffle entry",
            firstName: creator.firstName,
            lastName: creator.lastName,
            at: link.submittedAt,
          });
        }

        // Raffle entrant count — marked done AND linked, for whatever
        // opportunity is currently live (matched by its updatedAt).
        if (weeklyOpportunity && oppDone?.updatedAt === weeklyOpportunity.updatedAt && oppLinks.length > 0) {
          entrantCounts["challenge-raffle"] = (entrantCounts["challenge-raffle"] ?? 0) + 1;
        }
        if (oppDone?.updatedAt) {
          feed.push({
            label: "marked the opportunity done",
            firstName: creator.firstName,
            lastName: creator.lastName,
            at: oppDone.updatedAt,
          });
        }
      })
    );

    feed.sort((a, b) => b.at.localeCompare(a.at));

    return NextResponse.json({ entrantCounts, feed: feed.slice(0, 12) });
  } catch {
    return NextResponse.json({ entrantCounts: {}, feed: [] });
  }
}
