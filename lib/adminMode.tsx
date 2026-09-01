"use client";

// Dev-preview admin mode — a stand-in for real coach/admin roles (CP8).
// Toggled from the header, persisted in localStorage per browser. When on,
// every page shows its own inline add/edit/delete controls — no separate
// /admin route. Real role-based permissions replace this once auth exists.

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "pixory-admin-mode";

const AdminModeContext = createContext<{ enabled: boolean; toggle: () => void }>({
  enabled: false,
  toggle: () => {},
});

export function AdminModeProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // One-time read of a value that can only be known on the client (there is
    // no SSR-safe way to know localStorage ahead of mount) — intentionally
    // not the "sync external store" pattern since this never changes outside
    // of toggle() below, which already owns its own setState.
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEnabled(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // localStorage unavailable — admin mode just won't persist
    }
  }, []);

  function toggle() {
    setEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }

  return <AdminModeContext.Provider value={{ enabled, toggle }}>{children}</AdminModeContext.Provider>;
}

export function useAdminMode() {
  return useContext(AdminModeContext);
}
