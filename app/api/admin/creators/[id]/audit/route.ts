// Coaches tick off a new creator's first/second audit here. Stored under
// "new-creator-audits" — separate from the creator's own track record so a
// creator saving their picks can never overwrite an audit a coach marked
// done. Admin-only.

import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { loadProfileById } from "@/lib/creatorRegistry";
import { loadCreatorDataServer, saveCreatorDataServer } from "@/lib/creatorData";
import type { NewCreatorAudits } from "@/lib/newCreatorTrack";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const which = body?.audit;
  if ((which !== "first" && which !== "second") || typeof body?.done !== "boolean") {
    return NextResponse.json({ ok: false, error: "audit must be first/second and done true/false." }, { status: 400 });
  }

  try {
    const profile = await loadProfileById(id);
    if (!profile) return NextResponse.json({ ok: false, error: "No creator with that id." }, { status: 404 });
    const current = await loadCreatorDataServer<NewCreatorAudits | null>("new-creator-audits", id, null);
    const next: NewCreatorAudits = {
      first: current?.first ?? null,
      second: current?.second ?? null,
      [which]: body.done ? new Date().toISOString() : null,
    };
    await saveCreatorDataServer("new-creator-audits", id, next);
    return NextResponse.json({ ok: true, audits: next });
  } catch {
    return NextResponse.json({ ok: false, error: "Couldn't reach storage — try again." }, { status: 500 });
  }
}
