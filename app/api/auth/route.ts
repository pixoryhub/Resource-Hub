// Real creator identity — signup/login/session, backed by Netlify Blobs
// (see lib/serverStore.ts, lib/creatorRegistry.ts) instead of localStorage,
// so the same name + PIN works from any device, not just the browser
// someone first signed up in.
//
// The PIN is hashed before it's stored (never kept in plain text); the
// session cookie holds only a profile id plus an HMAC signature (using
// AUTH_SECRET) so it can't be forged from the client, and is httpOnly so
// page JS can't read it either.

import { NextRequest, NextResponse } from "next/server";
import { createHash, createHmac, randomUUID } from "crypto";
import { getBlobStore } from "@/lib/serverStore";
import {
  PROFILES_STORE,
  type Profile,
  loadProfileByNameKey,
  loadProfileById,
  addToCreatorIndex,
  toPublicCreator,
} from "@/lib/creatorRegistry";

const COOKIE_NAME = "pixory_session";

function normaliseName(first: string, last: string) {
  return `${first.trim().toLowerCase()}|${last.trim().toLowerCase()}`;
}

function hashPin(nameKey: string, pin: string) {
  return createHash("sha256").update(`${nameKey}:${pin}`).digest("hex");
}

function authSecret(): string | null {
  return process.env.AUTH_SECRET || null;
}

function signSession(profileId: string, secret: string) {
  const sig = createHmac("sha256", secret).update(profileId).digest("hex");
  return `${profileId}.${sig}`;
}

function verifySession(token: string | undefined, secret: string): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  const profileId = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(profileId).digest("hex");
  return sig === expected ? profileId : null;
}

export async function GET(req: NextRequest) {
  const secret = authSecret();
  if (!secret) return NextResponse.json({ creator: null });
  const profileId = verifySession(req.cookies.get(COOKIE_NAME)?.value, secret);
  if (!profileId) return NextResponse.json({ creator: null });
  const profile = await loadProfileById(profileId).catch(() => null);
  return NextResponse.json({ creator: profile ? toPublicCreator(profile) : null });
}

export async function POST(req: NextRequest) {
  const secret = authSecret();
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "Sign-in isn't configured — set AUTH_SECRET in .env.local (and in Netlify's env vars)." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const action = body?.action === "signup" ? "signup" : "login";
  const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : "";
  const pin = typeof body?.pin === "string" ? body.pin : "";

  if (!firstName || !lastName) {
    return NextResponse.json({ ok: false, error: "Enter your first and last name." }, { status: 400 });
  }
  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json({ ok: false, error: "PIN must be 4 digits." }, { status: 400 });
  }

  const nameKey = normaliseName(firstName, lastName);

  let profile: Profile | null;
  try {
    profile = await loadProfileByNameKey(nameKey);

    if (action === "signup") {
      if (profile) {
        return NextResponse.json(
          { ok: false, error: "That name is already signed up — log in instead, or ask a coach to reset your PIN." },
          { status: 409 }
        );
      }
      const id = randomUUID();
      profile = { id, firstName, lastName, nameKey, pinHash: hashPin(nameKey, pin), createdAt: new Date().toISOString() };
      const store = getBlobStore(PROFILES_STORE);
      await store.set(nameKey, JSON.stringify(profile));
      await store.set(`by-id:${id}`, nameKey);
      await addToCreatorIndex(id);
    } else {
      if (!profile) {
        return NextResponse.json({ ok: false, error: "No profile with that name yet — sign up first." }, { status: 404 });
      }
      if (profile.pinHash !== hashPin(nameKey, pin)) {
        return NextResponse.json({ ok: false, error: "Name or PIN don't match." }, { status: 401 });
      }
    }
  } catch {
    return NextResponse.json(
      { ok: false, error: "Couldn't reach storage — check Netlify Blobs is configured and try again." },
      { status: 500 }
    );
  }

  const res = NextResponse.json({ ok: true, creator: toPublicCreator(profile) });
  res.cookies.set(COOKIE_NAME, signSession(profile.id, secret), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE_NAME);
  return res;
}
