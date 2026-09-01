// Shared admin-session check for server routes — same cookie/hash scheme
// as app/api/admin-auth, factored out so the new /api/admin/* routes (and
// admin-auth itself) can all use one implementation instead of drifting.

import { NextRequest } from "next/server";
import { createHash } from "crypto";

const COOKIE_NAME = "pixory_admin";

export function isAdminRequest(req: NextRequest): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const expected = createHash("sha256").update(password).digest("hex");
  return req.cookies.get(COOKIE_NAME)?.value === expected;
}
