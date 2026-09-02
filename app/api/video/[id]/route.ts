// Public streaming endpoint for uploaded video assets — used by both
// testimonials and the weekly opportunity's optional reference clip. See
// lib/videoStore.ts and app/api/admin/videos (the upload route). Not
// admin-gated: creators need to actually watch these.

import { NextRequest, NextResponse } from "next/server";
import { loadVideo } from "@/lib/videoStore";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const video = await loadVideo(id).catch(() => null);
  if (!video) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return new NextResponse(video.data, {
    headers: {
      "Content-Type": video.contentType,
      "Content-Length": String(video.data.byteLength),
      // Immutable — each upload gets a fresh id, so a cached copy can never go stale.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
