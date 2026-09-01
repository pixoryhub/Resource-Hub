// Coach reply to a coaching flag — the flag system has always promised a
// 48-hour reply (see components/coaching-flag/FlagHistory.tsx) but there
// was no way to actually send one until now. Admin-only.

import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { loadCreatorDataServer, saveCreatorDataServer } from "@/lib/creatorData";
import type { CoachingFlag } from "@/lib/data/types";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const flagId = typeof body?.flagId === "string" ? body.flagId : null;
  const response = typeof body?.response === "string" ? body.response.trim() : "";
  const respondedBy = typeof body?.respondedBy === "string" && body.respondedBy.trim() ? body.respondedBy.trim() : "Your coach";

  if (!flagId || !response) {
    return NextResponse.json({ ok: false, error: "Missing flagId or response." }, { status: 400 });
  }

  try {
    const flags = await loadCreatorDataServer<CoachingFlag[]>("flags", id, []);
    const index = flags.findIndex((f) => f.id === flagId);
    if (index === -1) return NextResponse.json({ ok: false, error: "No flag with that id." }, { status: 404 });

    flags[index] = {
      ...flags[index],
      response,
      respondedBy,
      respondedAt: new Date().toISOString(),
      status: "answered",
    };
    await saveCreatorDataServer("flags", id, flags);

    return NextResponse.json({ ok: true, flag: flags[index] });
  } catch {
    return NextResponse.json({ ok: false, error: "Couldn't reach storage — try again." }, { status: 500 });
  }
}
