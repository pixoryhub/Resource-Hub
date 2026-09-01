// Shared server-side storage for anything that must be the same for every
// creator on every device — profiles/PINs and their app data. Backed by
// Netlify Blobs since Netlify is the deploy target (§ docs/DEPLOY.md); it
// needs no separate database signup.
//
// On a real Netlify deploy, Netlify injects blob credentials into every
// function automatically — getStore(name) just works there. Locally
// (`next dev`), that context doesn't exist, so we fall back to manually
// configured credentials (NETLIFY_SITE_ID / NETLIFY_AUTH_TOKEN in
// .env.local) if present. Either way, if neither is available this throws a
// clear error rather than silently no-op-ing.

import { getStore } from "@netlify/blobs";

export function getBlobStore(name: string) {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;
  if (siteID && token) {
    return getStore({ name, siteID, token });
  }
  return getStore(name);
}
