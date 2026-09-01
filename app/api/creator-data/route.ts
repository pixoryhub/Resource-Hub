// Per-creator app data (shot lists, Creator Hub completions, coaching
// flags) — server-side via Netlify Blobs, keyed off the signed session
// cookie (never a client-supplied id), so a creator's data follows their
// login to any device instead of staying stuck in one browser's
// localStorage. See lib/creatorStorage.ts for the client-side wrapper.

import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { getBlobStore } from "@/lib/serverStore";

const COOKIE_NAME = "pixory_session";
const DATA_STORE = "pixory-creator-data";

function verifySession(token: string | undefined, secret: string): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  const profileId = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(profileId).digest("hex");
  return sig === expected ? profileId : null;
}

function requireCreatorId(req: NextRequest): string | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return verifySession(req.cookies.get(COOKIE_NAME)?.value, secret);
}

export async function GET(req: NextRequest) {
  const creatorId = requireCreatorId(req);
  if (!creatorId) return NextResponse.json({ value: null }, { status: 401 });

  const namespace = req.nextUrl.searchParams.get("namespace");
  if (!namespace) return NextResponse.json({ error: "Missing namespace" }, { status: 400 });

  try {
    const raw = await getBlobStore(DATA_STORE).get(`${namespace}:${creatorId}`, { type: "text" });
    return NextResponse.json({ value: raw ? JSON.parse(raw) : null });
  } catch {
    return NextResponse.json({ error: "Storage unavailable" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const creatorId = requireCreatorId(req);
  if (!creatorId) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const namespace = typeof body?.namespace === "string" ? body.namespace : null;
  if (!namespace || !("value" in (body ?? {}))) {
    return NextResponse.json({ ok: false, error: "Missing namespace or value" }, { status: 400 });
  }

  try {
    await getBlobStore(DATA_STORE).set(`${namespace}:${creatorId}`, JSON.stringify(body.value));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Storage unavailable" }, { status: 500 });
  }
}
