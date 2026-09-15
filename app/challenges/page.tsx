import { getChallenges, getWeeklyOpportunity } from "@/lib/data";
import ChallengesClient from "@/components/challenges/ChallengesClient";
import SectionGate from "@/components/SectionGate";

// Admin-editable and Blobs-backed (see lib/data/content.ts), same reason
// this can't be statically prerendered as app/page.tsx and
// app/creator-hub/page.tsx — the store only exists at request time on
// Netlify's infrastructure.
export const dynamic = "force-dynamic";

export default async function ChallengesPage() {
  const [challenges, weeklyOpportunity] = await Promise.all([getChallenges(), getWeeklyOpportunity()]);

  return (
    <SectionGate sectionKey="challenges">
      <ChallengesClient initial={challenges} weeklyOpportunity={weeklyOpportunity} />
    </SectionGate>
  );
}
