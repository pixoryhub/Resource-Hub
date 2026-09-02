// Public serving endpoint for admin-uploaded thumbnail images. See
// lib/imageStore.ts and app/api/admin/images (the upload route). Not
// admin-gated: everyone viewing the hub needs to see these.

import { NextRequest, NextResponse } from "next/server";
import { loadImage } from "@/lib/imageStore";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const image = await loadImage(id).catch(() => null);
  if (!image) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return new NextResponse(image.data, {
    headers: {
      "Content-Type": image.contentType,
      "Content-Length": String(image.data.byteLength),
      // Immutable — each upload gets a fresh id, so a cached copy can never go stale.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
