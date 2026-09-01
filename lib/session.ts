// The fixed demo creator fixtures were originally seeded under — still used
// server-side as the id for shared/example content (the golden-case Shot
// List template, and until it's migrated, the Coaching Flag demo data).
// Real per-creator identity is now lib/localAuth.tsx; a real server-side
// session (tied to a database, not localStorage) is still CP8.

export const DEV_CREATOR_ID = "creator-1";

export function getSessionCreatorId(): string {
  return DEV_CREATOR_ID;
}
