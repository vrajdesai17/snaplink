export interface OGData {
  title: string | null;
  description: string | null;
  image: string | null;
}

function extractMeta(html: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const match = html.match(re);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

/**
 * Fetches Open Graph metadata for a URL.
 * Used to enrich link previews in the dashboard.
 * Fails silently — a missing preview is never a hard error.
 */
export async function fetchOGMetadata(url: string): Promise<OGData> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "SnapLink/1.0 (+https://github.com/snaplink) OGFetcher/1.0",
        Accept: "text/html",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return { title: null, description: null, image: null };

    const html = await res.text();

    const title = extractMeta(html, [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
      /<title[^>]*>([^<]{1,200})<\/title>/i,
    ]);

    const description = extractMeta(html, [
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
    ]);

    const image = extractMeta(html, [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    ]);

    return { title, description, image };
  } catch {
    return { title: null, description: null, image: null };
  }
}
