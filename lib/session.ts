// Dev bypass — §3.5. Real login lands in CP8; until then, every visitor
// is treated as this one seeded creator so every screen can be looked at
// without a login wall.

export const DEV_CREATOR_ID = "creator-1";

export function getSessionCreatorId(): string {
  return DEV_CREATOR_ID;
}
