"use client";

// Page-visibility settings (see lib/data/content.ts's SiteSettings) —
// shared by Header (hides the nav link) and SectionGate (hides the page
// itself for non-admins). Fetched once per page load; not real-time, so a
// creator already on a page that gets hidden mid-session won't be kicked
// out until their next navigation — acceptable for "I'm about to fix this,
// don't show it for now," not meant as a hard security boundary.

import { useEffect, useState } from "react";

export type CreatorHubChallengesSlot = "top" | "middle" | "bottom";

export function useSiteSettings() {
  const [hiddenNavKeys, setHiddenNavKeys] = useState<string[]>([]);
  const [creatorHubChallengesSlot, setCreatorHubChallengesSlot] = useState<CreatorHubChallengesSlot>("middle");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/site-settings")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data.hiddenNavKeys)) setHiddenNavKeys(data.hiddenNavKeys);
        if (["top", "middle", "bottom"].includes(data.creatorHubChallengesSlot)) {
          setCreatorHubChallengesSlot(data.creatorHubChallengesSlot);
        }
      })
      .catch(() => {
        // network error — default to nothing hidden
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { hiddenNavKeys, creatorHubChallengesSlot, ready };
}
