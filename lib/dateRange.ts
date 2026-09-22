// Shared "is this ISO timestamp within an admin-picked from/to date range"
// check — every admin filter that lets a coach narrow by date (the
// activity log, creators-by-join-date, ...) uses this same rule, so a date
// picked as "to" always means through the end of that day, not just up to
// midnight.
export function isWithinDateRange(iso: string | null, fromDate: string, toDate: string): boolean {
  if (!iso) return !fromDate && !toDate;
  const t = new Date(iso).getTime();
  if (fromDate && t < new Date(fromDate + "T00:00:00").getTime()) return false;
  if (toDate && t > new Date(toDate + "T23:59:59").getTime()) return false;
  return true;
}
