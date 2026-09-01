// Fetches a URL server-side and returns a thumbnail for that specific page —
// not the platform's own branding. For platforms with an oEmbed API (Canva,
// Loom, YouTube, Vimeo, TikTok, Figma) we call that directly, since it
// returns the actual content thumbnail; those apps are client-rendered and
// scraping their static HTML mostly finds the generic app-shell image
// instead. Everything else falls back to reading the page's own
// og:image/twitter:image tag.

import { NextRequest, NextResponse } from "next/server";

const BLOCKED_HOSTNAMES = new Set(["localhost", "0.0.0.0"]);

function isPrivateHostname(hostname: string): boolean {
  if (BLOCKED_HOSTNAMES.has(hostname)) return true;
  if (hostname === "127.0.0.1" || hostname.startsWith("127.")) return true;
  if (hostname === "::1") return true;
  if (/^10\./.test(hostname)) return true;
  if (/^192\.168\./.test(hostname)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)) return true;
  if (hostname.endsWith(".local")) return true;
  return false;
}

interface OEmbedProvider {
  name: string;
  match: (url: URL) => boolean;
  endpoint: (rawUrl: string) => string;
}

const OEMBED_PROVIDERS: OEmbedProvider[] = [
  {
    name: "YouTube",
    match: (u) => /(^|\.)youtube\.com$/.test(u.hostname) || u.hostname === "youtu.be",
    endpoint: (raw) => `https://www.youtube.com/oembed?url=${encodeURIComponent(raw)}&format=json`,
  },
  {
    name: "Vimeo",
    match: (u) => /(^|\.)vimeo\.com$/.test(u.hostname),
    endpoint: (raw) => `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(raw)}`,
  },
  {
    name: "Loom",
    match: (u) => /(^|\.)loom\.com$/.test(u.hostname),
    endpoint: (raw) => `https://www.loom.com/v1/oembed?url=${encodeURIComponent(raw)}`,
  },
  {
    name: "Canva",
    match: (u) => /(^|\.)canva\.com$/.test(u.hostname),
    endpoint: (raw) => `https://www.canva.com/_oembed?url=${encodeURIComponent(raw)}&format=json`,
  },
  {
    name: "TikTok",
    match: (u) => /(^|\.)tiktok\.com$/.test(u.hostname),
    endpoint: (raw) => `https://www.tiktok.com/oembed?url=${encodeURIComponent(raw)}`,
  },
  {
    name: "Figma",
    match: (u) => /(^|\.)figma\.com$/.test(u.hostname),
    endpoint: (raw) => `https://www.figma.com/api/oembed?url=${encodeURIComponent(raw)}`,
  },
];

async function tryOEmbed(target: URL, rawUrl: string, signal: AbortSignal): Promise<string | null> {
  const provider = OEMBED_PROVIDERS.find((p) => p.match(target));
  if (!provider) return null;
  try {
    const res = await fetch(provider.endpoint(rawUrl), {
      signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.thumbnail_url === "string" ? data.thumbnail_url : null;
  } catch {
    return null;
  }
}

// Google Drive doesn't set a usable og:image on its file-view pages (those
// need a login to render), but publicly-shared files (video or image) do
// have a real thumbnail — including an actual video frame — behind Drive's
// dedicated thumbnail endpoint.
function extractDriveFileId(u: URL): string | null {
  const pathMatch = u.pathname.match(/\/file\/d\/([^/]+)/);
  if (pathMatch) return pathMatch[1];
  const idParam = u.searchParams.get("id");
  if (idParam) return idParam;
  return null;
}

async function tryGoogleDriveThumbnail(target: URL, signal: AbortSignal): Promise<string | null> {
  if (!/(^|\.)drive\.google\.com$/.test(target.hostname)) return null;
  const fileId = extractDriveFileId(target);
  if (!fileId) return null;

  const thumbnailUrl = `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1000`;
  try {
    const res = await fetch(thumbnailUrl, { signal, method: "HEAD", redirect: "follow" });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    return contentType.startsWith("image/") ? thumbnailUrl : null;
  } catch {
    return null;
  }
}

// Some platforms always return the same "logged out" / app-shell image for
// a page the fetcher can't actually see (private Notion pages are the case
// that surfaced this) — better to say so than to silently show the wrong
// picture.
const KNOWN_GENERIC_IMAGES = [
  /app\.notion\.com\/images\/meta\/default\.png/i,
  /\/(default|placeholder|fallback|og-default|social-default)\.(png|jpe?g)(\?|$)/i,
];

function isGenericFallbackImage(imageUrl: string): boolean {
  return KNOWN_GENERIC_IMAGES.some((re) => re.test(imageUrl));
}

function extractMetaImage(html: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["'][^>]*>/i,
  ];
  for (const re of patterns) {
    const match = html.match(re);
    if (match?.[1]) return match[1];
  }
  return null;
}

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url");
  if (!urlParam) {
    return NextResponse.json({ image: null, error: "Missing url" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(urlParam);
  } catch {
    return NextResponse.json({ image: null, error: "That doesn't look like a valid URL." });
  }

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return NextResponse.json({ image: null, error: "Only http/https links are supported." });
  }
  if (isPrivateHostname(target.hostname)) {
    return NextResponse.json({ image: null, error: "That address isn't allowed." });
  }

  if (target.hostname === "app.notion.com") {
    return NextResponse.json({
      image: null,
      error:
        "This is a private Notion link (copied from inside the app) — it needs a login to view, so there's no page to preview. In Notion, use Share → Publish to web and paste that link instead, or paste an image below.",
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const driveImage = await tryGoogleDriveThumbnail(target, controller.signal);
    if (driveImage) {
      return NextResponse.json({ image: driveImage });
    }

    const oEmbedImage = await tryOEmbed(target, urlParam, controller.signal);
    if (oEmbedImage && !isGenericFallbackImage(oEmbedImage)) {
      return NextResponse.json({ image: oEmbedImage });
    }

    const res = await fetch(target.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PixoryLinkPreview/1.0; +https://pixoryofficial.com)",
        Accept: "text/html",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ image: null, error: `That link returned an error (${res.status}).` });
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return NextResponse.json({ image: null, error: "That link isn't a web page." });
    }

    const html = await res.text();
    const rawImage = extractMetaImage(html);
    const image = rawImage && !isGenericFallbackImage(rawImage) ? rawImage : null;
    return NextResponse.json({
      image,
      error: image
        ? undefined
        : rawImage
          ? "That link only has a generic preview image — try pasting one manually below."
          : "No preview image found for that link.",
    });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "AbortError";
    return NextResponse.json({
      image: null,
      error: timedOut ? "That link took too long to respond." : "Couldn't fetch that link.",
    });
  } finally {
    clearTimeout(timeout);
  }
}
