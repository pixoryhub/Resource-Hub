"use client";

// Client-side driver for chunked video uploads — see
// app/api/admin/videos/chunk/route.ts for why this exists (Netlify's
// function request-body limit sits well under any real video file). Splits
// the file into pieces under that limit and uploads them one at a time,
// returning the final asset id once the server has reassembled them.

const CHUNK_BYTES = 4 * 1024 * 1024; // 4MB — safely under Netlify's ~6MB request cap

export async function uploadVideoChunked(file: File): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const uploadId = crypto.randomUUID();
  const total = Math.max(1, Math.ceil(file.size / CHUNK_BYTES));

  for (let index = 0; index < total; index++) {
    const start = index * CHUNK_BYTES;
    const chunk = file.slice(start, start + CHUNK_BYTES);

    const formData = new FormData();
    formData.append("chunk", chunk, `chunk-${index}`);
    formData.append("uploadId", uploadId);
    formData.append("index", String(index));
    formData.append("total", String(total));
    formData.append("contentType", file.type || "video/mp4");

    let res: Response;
    try {
      res = await fetch("/api/admin/videos/chunk", { method: "POST", body: formData });
    } catch {
      return { ok: false, error: "Couldn't reach the server — try again." };
    }

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      return { ok: false, error: data?.error ?? "Upload failed — try again." };
    }
    if (data.done) {
      return { ok: true, id: data.id as string };
    }
  }

  return { ok: false, error: "Upload didn't complete — try again." };
}
