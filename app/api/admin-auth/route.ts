// Temporary password gate for Admin mode — a stand-in for real coach/admin
// logins until CP8. The password itself lives only in the environment
// (never shipped in client JS); the cookie is httpOnly so it can't be read
// or forged via page JavaScript, and its value is a hash rather than a
// plain "1" so it isn't trivially guessable either.

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const COOKIE_NAME = "pixory_admin";

function expectedToken(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return createHash("sha256").update(password).digest("hex");
}

export async function GET(req: NextRequest) {
  const token = expectedToken();
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  const enabled = !!token && cookie === token;
  return NextResponse.json({ enabled });
}

export async function POST(req: NextRequest) {
  const token = expectedToken();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Admin mode isn't configured — set ADMIN_PASSWORD in .env.local." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: "Incorrect password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE_NAME);
  return res;
}
