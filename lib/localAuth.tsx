"use client";

// Real creator identity — talks to app/api/auth (backed by Netlify Blobs),
// not localStorage. The same name + 4-digit PIN now works on any device;
// the session itself is an httpOnly signed cookie, so it survives reloads
// but can't be read or forged from page JS. Component name kept as
// lib/localAuth.tsx / useAuth() to avoid touching every import site.

import { createContext, useContext, useEffect, useState } from "react";

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

const AuthContext = createContext<AuthState>({
  creator: null,
  ready: false,
  signUp: async () => ({ ok: false, error: "Not ready" }),
  logIn: async () => ({ ok: false, error: "Not ready" }),
  logOut: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [creator, setCreator] = useState<Creator | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setCreator(data.creator ?? null);
      })
      .catch(() => {
        // network error — stay logged out
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(action: "signup" | "login", firstName: string, lastName: string, pin: string) {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, firstName, lastName, pin }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setCreator(data.creator);
        return { ok: true };
      }
      return { ok: false, error: data.error ?? "Something went wrong." };
    } catch {
      return { ok: false, error: "Couldn't reach the server — try again." };
    }
  }

  async function signUp(firstName: string, lastName: string, pin: string) {
    return submit("signup", firstName, lastName, pin);
  }

  async function logIn(firstName: string, lastName: string, pin: string) {
    return submit("login", firstName, lastName, pin);
  }

  function logOut() {
    setCreator(null);
    fetch("/api/auth", { method: "DELETE" }).catch(() => {
      // already logged out client-side; cookie will just linger until it expires
    });
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
