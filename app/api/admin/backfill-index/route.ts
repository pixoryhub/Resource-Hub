// One-off (and safe to re-run) repair tool: rebuilds the "all creator ids"
// index (lib/creatorRegistry.ts) from the profiles that actually exist in
// Blobs. Needed once because the index was added after some creators had
// already signed up, so their ids were never recorded in it — and useful
// again any time the index and the real profiles drift. Admin-only.

import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { getBlobStore } from "@/lib/serverStore";
import { PROFILES_STORE, type Profile } from "@/lib/creatorRegistry";

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }

  try {
    const store = getBlobStore(PROFILES_STORE);
    const { blobs } = await store.list();
    const ids: string[] = [];

    for (const { key } of blobs) {
      if (key === "all-ids" || key.startsWith("by-id:")) continue;
      const raw = await store.get(key, { type: "text" });
      if (!raw) continue;
      const profile = JSON.parse(raw) as Profile;
      if (profile.id) ids.push(profile.id);
    }

    await store.set("all-ids", JSON.stringify(ids));
    return NextResponse.json({ ok: true, count: ids.length, ids });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
