// Admin-only: save (or clear) the view count a coach has manually logged
// against one recreation link. See lib/recreationViewCounts.ts.

import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { setViewCount } from "@/lib/recreationViewCounts";

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const linkKey = body?.linkKey;
  if (typeof linkKey !== "string" || !linkKey) {
    return NextResponse.json({ ok: false, error: "Missing linkKey." }, { status: 400 });
  }
  const views = body?.views === null ? null : Number(body?.views);
  if (views !== null && (!Number.isFinite(views) || views < 0)) {
    return NextResponse.json({ ok: false, error: "Invalid view count." }, { status: 400 });
  }

  try {
    await setViewCount(linkKey, views);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Couldn't reach storage — try again." }, { status: 500 });
  }
}
