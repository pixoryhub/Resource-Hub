// Tiny per-creator persistence helper — keyed by the locally-authenticated
// creator's id (see lib/localAuth.tsx). This is what makes ticks and shot
// lists belong to one person instead of resetting/overwriting each other.
// It's browser-local, not a real database — see lib/localAuth.tsx for why.

export function loadCreatorData<T>(namespace: string, creatorId: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`pixory-${namespace}-${creatorId}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveCreatorData<T>(namespace: string, creatorId: string, value: T): void {
  try {
    localStorage.setItem(`pixory-${namespace}-${creatorId}`, JSON.stringify(value));
  } catch {
    // localStorage unavailable — this creator's data just won't persist
  }
}
