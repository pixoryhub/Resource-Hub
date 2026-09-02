"use client";

// Wraps a page whose visibility an admin can toggle off (see
// lib/data/content.ts's SiteSettings, toggled from the admin dashboard).
// Hidden pages still render normally for admins — "take it down while I
// fix it" means down for creators, not locked away from the person fixing
// it — everyone else sees a friendly "check back soon" instead.

import { useAdminMode } from "@/lib/adminMode";
import { useSiteSettings } from "@/lib/useSiteSettings";

export default function SectionGate({ sectionKey, children }: { sectionKey: string; children: React.ReactNode }) {
  const { enabled: adminMode, ready: adminReady } = useAdminMode();
  const { hiddenNavKeys, ready: settingsReady } = useSiteSettings();

  if (!adminReady || !settingsReady) return null;

  const hidden = hiddenNavKeys.includes(sectionKey);
  if (hidden && !adminMode) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <p className="eyebrow mb-3">Temporarily unavailable</p>
        <h1 className="headline text-text">This page is being worked on</h1>
        <p className="mt-3 text-sm text-text-muted">Check back soon — everything else is working as usual.</p>
      </div>
    );
  }

  return <>{children}</>;
}
