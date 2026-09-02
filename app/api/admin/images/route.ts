// Admin-only thumbnail image upload — lets an admin pick their own image
// (e.g. a screenshot of one specific slide) as a resource/video thumbnail
// instead of whatever a linked platform's og:image happens to be. Accepts
// multipart/form-data with a single "file" field, stores it, and returns an
// id — the served URL is /api/image/{id} (see lib/imageStore.ts).

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { isAdminRequest } from "@/lib/adminAuth";
import { saveImage } from "@/lib/imageStore";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB — generous for a slide screenshot/export
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

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
    return NextResponse.json({ ok: false, error: "That image is too large (8MB max)." }, { status: 400 });
  }
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ ok: false, error: "Use a PNG, JPEG, WebP, or GIF image." }, { status: 400 });
  }

  try {
    const id = randomUUID();
    const buffer = await file.arrayBuffer();
    await saveImage(id, buffer, file.type || "image/jpeg");
    return NextResponse.json({ ok: true, url: `/api/image/${id}` });
  } catch {
    return NextResponse.json({ ok: false, error: "Couldn't reach storage — try again." }, { status: 500 });
  }
}
