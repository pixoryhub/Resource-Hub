// Public read of page-visibility settings (see lib/data/content.ts) —
// every visitor's Header needs this to know which nav pages to hide, not
// just admins, so this isn't behind the admin gate the way saving it is
// (see app/api/admin/content for the save side).

import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/data/content";

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ hiddenNavKeys: [] });
  }
}
