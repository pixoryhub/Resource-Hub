// Admin-only video upload — used by testimonials and the weekly
// opportunity's optional reference clip (see lib/videoStore.ts). Accepts
// multipart/form-data with a single "file" field, stores it, and returns
// an id a videoAssetId field can point at.

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { isAdminRequest } from "@/lib/adminAuth";
import { saveVideo } from "@/lib/videoStore";

const MAX_BYTES = 50 * 1024 * 1024; // 50MB — generous for a short talking-head clip

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "No file uploaded." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "That file is too large (50MB max)." }, { status: 400 });
  }

  try {
    const id = randomUUID();
    const buffer = await file.arrayBuffer();
    await saveVideo(id, buffer, file.type || "video/mp4");
    return NextResponse.json({ ok: true, id });
  } catch {
    return NextResponse.json({ ok: false, error: "Couldn't reach storage — try again." }, { status: 500 });
  }
}
