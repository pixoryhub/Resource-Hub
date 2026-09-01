import { NextResponse } from "next/server";

// Netlify has its own "Durable" edge cache layer, separate from this app's
// own Cache-Control headers — it was caching "/" and "/creator-hub" (both
// force-dynamic, since their content is admin-editable and lives in
// Netlify Blobs — see lib/data/content.ts) for a very long TTL, so admin
// edits appeared to "not save" when really they saved fine but the page
// kept serving a stale snapshot. Netlify-CDN-Cache-Control is the header
// its own cache layer actually honours (plain Cache-Control only affects
// browsers/downstream caches, not Netlify's).
export function middleware() {
  const res = NextResponse.next();
  res.headers.set("Netlify-CDN-Cache-Control", "no-store");
  return res;
}

export const config = {
  matcher: ["/", "/creator-hub"],
};
