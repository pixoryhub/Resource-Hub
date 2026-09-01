"use client";

import { useState } from "react";
import { useAuth } from "@/lib/localAuth";

function PinInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
        placeholder="4-digit PIN"
        className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 pr-11 tracking-[0.3em] text-text placeholder:tracking-normal placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
        style={{ fontSize: "16px" }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide PIN" : "Show PIN"}
        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-text-faint hover:text-text"
      >
        {visible ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.9 18.9 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.9 18.9 0 0 1-2.17 3.19m-6.09-1.42a3 3 0 1 1-4.24-4.24" />
            <path d="M1 1l22 22" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default function LoginScreen() {
  const { signUp, logIn } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = tab === "login" ? await logIn(firstName, lastName, pin) : await signUp(firstName, lastName, pin);
    setSubmitting(false);
    if (!result.ok) setError(result.error ?? "Something went wrong.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="headline mb-8 text-center text-3xl text-text">pixory</p>

        <div className="card p-7 sm:p-8">
          <div className="mb-6 flex gap-1 rounded-full border border-border bg-bg p-1">
            {(["login", "signup"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTab(t);
                  setError(null);
                }}
                className={
                  "flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors " +
                  (tab === t ? "bg-text text-bg" : "text-text-muted hover:bg-accent-tint")
                }
              >
                {t === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          {tab === "login" ? (
            <div key="login" className="animate-fade-in">
              <h1 className="headline text-xl text-text">Welcome Back</h1>
              <p className="mt-1.5 text-sm text-text-muted">Enter your name and 4-digit PIN to continue.</p>
            </div>
          ) : (
            <div key="signup" className="animate-fade-in">
              <h1 className="headline text-xl text-text">Create Your Profile</h1>
              <p className="mt-1.5 text-sm text-text-muted">Enter your name and choose a 4-digit PIN.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
              style={{ fontSize: "16px" }}
              autoFocus
            />
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent"
              style={{ fontSize: "16px" }}
            />
            <PinInput value={pin} onChange={setPin} />

            {error && <p className="text-sm text-accent">{error}</p>}

            <button
              type="submit"
              disabled={submitting || !firstName || !lastName || pin.length !== 4}
              className="w-full rounded-full bg-text px-6 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {tab === "login" ? "Log In →" : "Sign Up →"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-text-faint">
            {tab === "login"
              ? "Use the same name and PIN you signed up with."
              : "Save your PIN somewhere safe — if you forget it, ask a coach to reset it for you."}
          </p>
        </div>
      </div>
    </div>
  );
}
