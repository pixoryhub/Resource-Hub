// Fetches a URL server-side and pulls its og:image/twitter:image meta tag,
// so an admin can use a linked video/Canva/etc.'s own preview image as the
// resource thumbnail instead of hunting down an image URL by hand.

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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
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
    const image = extractMetaImage(html);
    return NextResponse.json({ image, error: image ? undefined : "No preview image found for that link." });
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
