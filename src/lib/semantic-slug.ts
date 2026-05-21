/**
 * Novel: Generates human-readable slugs from URL content.
 * Extracts domain + path keywords to produce memorable codes
 * like "gh-nextjs" or "vercel-docs" instead of "x9k2mAB".
 * Falls back to random base62 on collision or unintelligible URLs.
 */

const DOMAIN_MAP: Record<string, string> = {
  "github.com": "gh",
  "gitlab.com": "gl",
  "youtube.com": "yt",
  "youtu.be": "yt",
  "twitter.com": "tw",
  "x.com": "x",
  "instagram.com": "ig",
  "linkedin.com": "li",
  "medium.com": "med",
  "stackoverflow.com": "so",
  "reddit.com": "rd",
  "dev.to": "dev",
  "vercel.com": "vercel",
  "netlify.com": "netlify",
  "npmjs.com": "npm",
  "pypi.org": "pypi",
  "docs.google.com": "gdocs",
  "drive.google.com": "gdrive",
  "figma.com": "figma",
  "notion.so": "notion",
  "loom.com": "loom",
};

const STOP_WORDS = new Set([
  "www", "com", "org", "net", "io", "dev", "app", "edu",
  "the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "of", "with", "by",
  "watch", "view", "post", "article", "page", "index", "home",
  "html", "php", "asp", "aspx", "jsp",
  "get", "set", "new", "edit", "delete", "create", "update", "show", "list",
  "tag", "tags", "category", "blog", "news", "about", "contact",
  "2023", "2024", "2025", "2026",
  "s", "d", "p", "v", "t",
]);

function slugify(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function extractKeywords(url: string): string[] {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, "");

    const pathWords = parsed.pathname
      .split("/")
      .filter(Boolean)
      .flatMap((seg) => seg.split(/[-_.]/))
      .map(slugify)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

    const domainAbbr = DOMAIN_MAP[hostname];
    if (domainAbbr) {
      return [domainAbbr, ...pathWords.slice(0, 2)];
    }

    const domainWords = hostname
      .split(".")
      .slice(0, -1)
      .flatMap((p) => p.split("-"))
      .map(slugify)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

    return [...domainWords.slice(0, 1), ...pathWords.slice(0, 2)];
  } catch {
    return [];
  }
}

export function generateSemanticSlug(url: string): string {
  const keywords = extractKeywords(url);
  if (keywords.length === 0) return "";

  return keywords
    .slice(0, 3)
    .join("-")
    .slice(0, 22)
    .replace(/-+$/, "");
}
