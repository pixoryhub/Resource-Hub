// Chunked video upload — Netlify's serverless functions hard-cap a
// request body at ~6MB, well below any real video clip, so a direct
// upload (see ../route.ts) fails with a bare network error before it ever
// reaches our code, no matter what limit our own code claims. The client
// (lib/videoUploadClient.ts) splits the file into sub-6MB pieces and POSTs
// them one at a time here; this route stashes each piece under a shared
// upload id and, once the last piece lands, concatenates them all into the
// real video asset and cleans up the temporary pieces.

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { isAdminRequest } from "@/lib/adminAuth";
import { getBlobStore } from "@/lib/serverStore";
import { saveVideo } from "@/lib/videoStore";

const CHUNK_STORE = "pixory-video-upload-chunks";
const MAX_TOTAL_BYTES = 200 * 1024 * 1024; // 200MB — generous ceiling for a short clip

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  const chunk = formData?.get("chunk");
  const uploadId = formData?.get("uploadId");
  const indexRaw = formData?.get("index");
  const totalRaw = formData?.get("total");
  const contentType = formData?.get("contentType");

  if (
    !(chunk instanceof File) ||
    typeof uploadId !== "string" ||
    typeof indexRaw !== "string" ||
    typeof totalRaw !== "string" ||
    typeof contentType !== "string"
  ) {
    return NextResponse.json({ ok: false, error: "Malformed chunk upload." }, { status: 400 });
  }

  const index = Number(indexRaw);
  const total = Number(totalRaw);
  if (!Number.isInteger(index) || !Number.isInteger(total) || index < 0 || total < 1 || index >= total) {
    return NextResponse.json({ ok: false, error: "Malformed chunk upload." }, { status: 400 });
  }

  try {
    const store = getBlobStore(CHUNK_STORE);
    const buffer = await chunk.arrayBuffer();
    await store.set(`${uploadId}:${index}`, buffer, { metadata: { size: buffer.byteLength } });

    if (index < total - 1) {
      return NextResponse.json({ ok: true, done: false });
    }

    // Last chunk — reassemble in order, then hand off to the real video
    // store and delete the scratch pieces.
    const pieces: ArrayBuffer[] = [];
    let totalBytes = 0;
    for (let i = 0; i < total; i++) {
      const piece = await store.get(`${uploadId}:${i}`, { type: "arrayBuffer" });
      if (!piece) {
        return NextResponse.json({ ok: false, error: "Upload lost a piece in transit — try again." }, { status: 400 });
      }
      totalBytes += piece.byteLength;
      if (totalBytes > MAX_TOTAL_BYTES) {
        return NextResponse.json({ ok: false, error: "That file is too large (200MB max)." }, { status: 400 });
      }
      pieces.push(piece);
    }

    const combined = new Uint8Array(totalBytes);
    let offset = 0;
    for (const piece of pieces) {
      combined.set(new Uint8Array(piece), offset);
      offset += piece.byteLength;
    }

    const id = randomUUID();
    await saveVideo(id, combined.buffer, contentType || "video/mp4");
    await Promise.all(Array.from({ length: total }, (_, i) => store.delete(`${uploadId}:${i}`)));

    return NextResponse.json({ ok: true, done: true, id });
  } catch {
    return NextResponse.json({ ok: false, error: "Couldn't reach storage — try again." }, { status: 500 });
  }
}
