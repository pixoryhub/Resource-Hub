import { getCurrentWeek } from "@/lib/data";
import { DEV_CREATOR_ID } from "@/lib/session";
import ShotListClient from "@/components/shot-list/ShotListClient";

export default async function ShotListGeneratorPage() {
  // The §12 golden case, seeded under the fixed demo id — used only as the
  // shared "Example" template. Each real creator's own week is loaded
  // client-side from their local profile (lib/localAuth.tsx), not from here.
  const exampleWeek = await getCurrentWeek(DEV_CREATOR_ID);

  if (!exampleWeek) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="eyebrow mb-3">Shot List Generator</p>
        <h1 className="text-3xl font-bold tracking-tight">No example week configured</h1>
      </div>
    );
  }

  return <ShotListClient initialWeek={exampleWeek} />;
}
