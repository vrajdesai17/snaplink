import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { cacheSet } from "@/lib/redis";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateId } from "@/lib/base62";
import { generateSemanticSlug } from "@/lib/semantic-slug";
import { fetchOGMetadata } from "@/lib/og-fetch";

async function resolveShortCode(url: string, customSlug?: string): Promise<{ code: string; isCustom: boolean; error?: string }> {
  if (customSlug) {
    if (!/^[a-zA-Z0-9-_]{3,20}$/.test(customSlug)) {
      return { code: "", isCustom: true, error: "Slug must be 3–20 chars: letters, numbers, hyphens, underscores." };
    }
    const taken = await prisma.url.findUnique({ where: { shortCode: customSlug } });
    if (taken) return { code: "", isCustom: true, error: "This slug is already taken." };
    return { code: customSlug, isCustom: true };
  }

  const semantic = generateSemanticSlug(url);
  if (semantic) {
    const exists = await prisma.url.findUnique({ where: { shortCode: semantic } });
    if (!exists) return { code: semantic, isCustom: false };

    const withSuffix = `${semantic.slice(0, 15)}-${generateId(3)}`;
    const suffixExists = await prisma.url.findUnique({ where: { shortCode: withSuffix } });
    if (!suffixExists) return { code: withSuffix, isCustom: false };
  }

  for (let i = 0; i < 5; i++) {
    const code = generateId(7);
    const exists = await prisma.url.findUnique({ where: { shortCode: code } });
    if (!exists) return { code, isCustom: false };
  }

  return { code: generateId(10), isCustom: false };
}

export async function POST(request: NextRequest) {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";

  const rateLimit = await checkRateLimit(`shorten:${ip}`, 10, 60_000);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in a minute." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": String(rateLimit.reset),
        },
      }
    );
  }

  let body: {
    url: string;
    customSlug?: string;
    expiresAt?: string;
    maxClicks?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { url, customSlug, expiresAt, maxClicks } = body;

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL is required." }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL." }, { status: 400 });
  }

  if (maxClicks !== undefined && (typeof maxClicks !== "number" || maxClicks < 1)) {
    return NextResponse.json({ error: "maxClicks must be a positive integer." }, { status: 400 });
  }

  const { code, isCustom, error } = await resolveShortCode(url, customSlug);
  if (error) return NextResponse.json({ error }, { status: 409 });

  const ogData = await fetchOGMetadata(url);

  const newUrl = await prisma.url.create({
    data: {
      originalUrl: url,
      shortCode: code,
      customCode: isCustom,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      maxClicks: maxClicks ?? null,
      ogTitle: ogData.title,
      ogDescription: ogData.description,
      ogImage: ogData.image,
    },
  });

  await cacheSet(
    `url:${code}`,
    86400,
    JSON.stringify({
      id: newUrl.id,
      originalUrl: newUrl.originalUrl,
      expiresAt: newUrl.expiresAt?.toISOString() ?? null,
      maxClicks: newUrl.maxClicks,
      clickCount: 0,
    })
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return NextResponse.json(
    {
      shortUrl: `${appUrl}/${code}`,
      shortCode: code,
      originalUrl: url,
      isCustom,
      ogTitle: ogData.title,
      ogDescription: ogData.description,
      ogImage: ogData.image,
    },
    { status: 201 }
  );
}
