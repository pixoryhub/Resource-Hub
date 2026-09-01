import type { CoachingFlag } from "./data/types";

const COOLDOWN_DAYS = 14;
const RESPONSE_PROMISE_HOURS = 48;

export function nextAvailableAt(mostRecent: CoachingFlag | undefined): Date | null {
  if (!mostRecent) return null;
  const submitted = new Date(mostRecent.submittedAt);
  return new Date(submitted.getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
}

export function isBlocked(flags: CoachingFlag[], now: Date): boolean {
  const mostRecent = [...flags].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
  const unlock = nextAvailableAt(mostRecent);
  return !!unlock && now < unlock;
}

export function hoursRemainingOnPromise(flag: CoachingFlag, now: Date): number {
  const deadline = new Date(new Date(flag.submittedAt).getTime() + RESPONSE_PROMISE_HOURS * 60 * 60 * 1000);
  return Math.max(0, Math.round((deadline.getTime() - now.getTime()) / (60 * 60 * 1000)));
}
