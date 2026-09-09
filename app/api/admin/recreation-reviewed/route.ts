// Admin-only: mark (or unmark) one recreation link as reviewed. See
// lib/recreationReviewed.ts.

import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { setReviewed } from "@/lib/recreationReviewed";

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const linkKey = body?.linkKey;
  if (typeof linkKey !== "string" || !linkKey) {
    return NextResponse.json({ ok: false, error: "Missing linkKey." }, { status: 400 });
  }
  const reviewed = !!body?.reviewed;

  try {
    await setReviewed(linkKey, reviewed);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Couldn't reach storage — try again." }, { status: 500 });
  }
}
