"use client";

// Simplest-possible per-creator identity, entirely client-side (localStorage).
// No server, no database — that's CP8/CP9. This exists so that, right now,
// two different people using the hub don't see or affect each other's ticks
// and shot lists. A real login (with real PIN hashing on a server, and data
// that syncs across a creator's own devices) replaces this later; until
// then, a profile only exists in the browser it was created in.

import { createContext, useContext, useEffect, useState } from "react";

interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  nameKey: string; // normalised "first|last", for uniqueness + login lookup
  pinHash: string;
}

interface Creator {
  id: string;
  firstName: string;
  lastName: string;
}

interface AuthState {
  creator: Creator | null;
  ready: boolean;
  signUp: (firstName: string, lastName: string, pin: string) => Promise<{ ok: boolean; error?: string }>;
  logIn: (firstName: string, lastName: string, pin: string) => Promise<{ ok: boolean; error?: string }>;
  logOut: () => void;
}

const PROFILES_KEY = "pixory-profiles";
const SESSION_KEY = "pixory-session";

const AuthContext = createContext<AuthState>({
  creator: null,
  ready: false,
  signUp: async () => ({ ok: false, error: "Not ready" }),
  logIn: async () => ({ ok: false, error: "Not ready" }),
  logOut: () => {},
});

function normaliseName(first: string, last: string) {
  return `${first.trim().toLowerCase()}|${last.trim().toLowerCase()}`;
}

async function hashPin(nameKey: string, pin: string): Promise<string> {
  const data = new TextEncoder().encode(`${nameKey}:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function loadProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    return raw ? (JSON.parse(raw) as Profile[]) : [];
  } catch {
    return [];
  }
}

function saveProfiles(profiles: Profile[]) {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch {
    // localStorage unavailable — profile just won't persist
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [creator, setCreator] = useState<Creator | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const sessionRaw = localStorage.getItem(SESSION_KEY);
      const profileId = sessionRaw ? (JSON.parse(sessionRaw) as { profileId: string }).profileId : null;
      if (profileId) {
        const profile = loadProfiles().find((p) => p.id === profileId);
        if (profile) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore of a value only knowable client-side
          setCreator({ id: profile.id, firstName: profile.firstName, lastName: profile.lastName });
        }
      }
    } catch {
      // ignore — just starts logged out
    } finally {
      setReady(true);
    }
  }, []);

  function setSession(profileId: string | null) {
    try {
      if (profileId) localStorage.setItem(SESSION_KEY, JSON.stringify({ profileId }));
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
  }

  async function signUp(firstName: string, lastName: string, pin: string) {
    const first = firstName.trim();
    const last = lastName.trim();
    if (!first || !last) return { ok: false, error: "Enter your first and last name." };
    if (!/^\d{4}$/.test(pin)) return { ok: false, error: "PIN must be 4 digits." };

    const nameKey = normaliseName(first, last);
    const profiles = loadProfiles();
    if (profiles.some((p) => p.nameKey === nameKey)) {
      return {
        ok: false,
        error: "That name is already signed up on this device — log in instead, or ask a coach to reset your PIN.",
      };
    }

    const id = `creator-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const pinHash = await hashPin(nameKey, pin);
    const profile: Profile = { id, firstName: first, lastName: last, nameKey, pinHash };
    saveProfiles([...profiles, profile]);
    setSession(id);
    setCreator({ id, firstName: first, lastName: last });
    return { ok: true };
  }

  async function logIn(firstName: string, lastName: string, pin: string) {
    const first = firstName.trim();
    const last = lastName.trim();
    if (!first || !last) return { ok: false, error: "Enter your first and last name." };
    if (!/^\d{4}$/.test(pin)) return { ok: false, error: "PIN must be 4 digits." };

    const nameKey = normaliseName(first, last);
    const profile = loadProfiles().find((p) => p.nameKey === nameKey);
    if (!profile) return { ok: false, error: "No profile with that name on this device yet — sign up first." };

    const pinHash = await hashPin(nameKey, pin);
    if (pinHash !== profile.pinHash) return { ok: false, error: "Name or PIN don't match." };

    setSession(profile.id);
    setCreator({ id: profile.id, firstName: profile.firstName, lastName: profile.lastName });
    return { ok: true };
  }

  function logOut() {
    setSession(null);
    setCreator(null);
  }

  return (
    <AuthContext.Provider value={{ creator, ready, signUp, logIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
