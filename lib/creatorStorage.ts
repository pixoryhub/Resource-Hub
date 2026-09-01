// Per-creator persistence — talks to app/api/creator-data (backed by
// Netlify Blobs), not localStorage. This is what makes ticks and shot lists
// belong to one person and follow them to any device instead of staying
// stuck in one browser. The server derives the creator from the signed
// session cookie, so `creatorId` here is kept only for the call-site shape
// (and as a safety check against stale/cross-account calls) — it's never
// trusted on its own.

export async function loadCreatorData<T>(namespace: string, _creatorId: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`/api/creator-data?namespace=${encodeURIComponent(namespace)}`);
    if (!res.ok) return fallback;
    const data = await res.json();
    return (data.value ?? fallback) as T;
  } catch {
    return fallback;
  }
}

export function saveCreatorData<T>(namespace: string, _creatorId: string, value: T): void {
  fetch("/api/creator-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ namespace, value }),
  }).catch(() => {
    // network error — this save just won't persist
  });
}
