"use client";

// Password-gated admin mode — a stand-in for real coach/admin roles (CP8).
// The password check happens server-side (app/api/admin-auth); an httpOnly
// cookie remembers the session, so it survives reloads but can't be read or
// forged from page JavaScript. When on, every page shows its own inline
// add/edit/delete controls — no separate /admin route needed for this.

import { createContext, useContext, useEffect, useState } from "react";

interface AdminModeState {
  enabled: boolean;
  ready: boolean; // false until the initial status check completes
  login: (password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AdminModeContext = createContext<AdminModeState>({
  enabled: false,
  ready: false,
  login: async () => ({ ok: false, error: "Not available" }),
  logout: async () => {},
});

export function AdminModeProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin-auth")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setEnabled(!!data.enabled);
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

  async function login(password: string) {
    try {
      const res = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setEnabled(true);
        return { ok: true };
      }
      return { ok: false, error: data.error ?? "Incorrect password." };
    } catch {
      return { ok: false, error: "Couldn't reach the server — try again." };
    }
  }

  async function logout() {
    setEnabled(false);
    try {
      await fetch("/api/admin-auth", { method: "DELETE" });
    } catch {
      // already logged out client-side; cookie will just linger until it expires
    }
  }

  return (
    <AdminModeContext.Provider value={{ enabled, ready, login, logout }}>
      {children}
    </AdminModeContext.Provider>
  );
}

export function useAdminMode() {
  return useContext(AdminModeContext);
}
