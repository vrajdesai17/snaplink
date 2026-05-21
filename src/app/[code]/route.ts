import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet, cacheDel } from "@/lib/redis";

interface CachedUrl {
  id: number;
  originalUrl: string;
  expiresAt: string | null;
  maxClicks: number | null;
  clickCount: number;
}

function parseBrowser(ua: string): string {
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\//.test(ua)) return "Opera";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua)) return "Safari";
  return "Other";
}

function parseOS(ua: string): string {
  if (/Windows NT/.test(ua)) return "Windows";
  if (/Android/.test(ua)) return "Android";
  if (/iPhone|iPad/.test(ua)) return "iOS";
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Other";
}

function parseDevice(ua: string): string {
  if (/Mobile|Android|iPhone/.test(ua)) return "Mobile";
  if (/iPad|Tablet/.test(ua)) return "Tablet";
  return "Desktop";
}

async function trackClick(urlId: number, req: NextRequest) {
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    "unknown";
  const ua = hdrs.get("user-agent") ?? "";
  const referer = hdrs.get("referer") ?? "";
  const country = hdrs.get("x-vercel-ip-country") ?? null;
  const city = hdrs.get("x-vercel-ip-city") ?? null;

  const now = new Date();

  await prisma.$transaction([
    prisma.click.create({
      data: {
        urlId,
        ipAddress: ip,
        userAgent: ua,
        referer,
        country,
        city,
        browser: parseBrowser(ua),
        os: parseOS(ua),
        device: parseDevice(ua),
        hourOfDay: now.getUTCHours(),
        dayOfWeek: now.getUTCDay(),
      },
    }),
    prisma.url.update({
      where: { id: urlId },
      data: { clickCount: { increment: 1 } },
    }),
  ]);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const cached = await cacheGet(`url:${code}`);
  if (cached) {
    const data: CachedUrl = JSON.parse(cached);
    if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
      return NextResponse.redirect(new URL("/?error=expired", request.url));
    }
    if (data.maxClicks !== null && data.clickCount >= data.maxClicks) {
      return NextResponse.redirect(new URL("/?error=maxed", request.url));
    }
    trackClick(data.id, request).catch(() => {});
    return NextResponse.redirect(data.originalUrl, { status: 302 });
  }

  const url = await prisma.url.findUnique({ where: { shortCode: code } });

  if (!url || !url.isActive) {
    return NextResponse.redirect(new URL("/?error=not-found", request.url));
  }

  if (url.expiresAt && url.expiresAt < new Date()) {
    await prisma.url.update({ where: { id: url.id }, data: { isActive: false } });
    return NextResponse.redirect(new URL("/?error=expired", request.url));
  }

  if (url.maxClicks !== null && url.clickCount >= url.maxClicks) {
    await prisma.url.update({ where: { id: url.id }, data: { isActive: false } });
    await cacheDel(`url:${code}`);
    return NextResponse.redirect(new URL("/?error=maxed", request.url));
  }

  const ttl = url.expiresAt
    ? Math.max(1, Math.floor((url.expiresAt.getTime() - Date.now()) / 1000))
    : 86400;

  await cacheSet(
    `url:${code}`,
    ttl,
    JSON.stringify({
      id: url.id,
      originalUrl: url.originalUrl,
      expiresAt: url.expiresAt?.toISOString() ?? null,
      maxClicks: url.maxClicks,
      clickCount: url.clickCount,
    } satisfies CachedUrl)
  );

  if (url.maxClicks !== null && url.clickCount + 1 >= url.maxClicks) {
    await prisma.url.update({ where: { id: url.id }, data: { isActive: false } });
    await cacheDel(`url:${code}`);
  }

  trackClick(url.id, request).catch(() => {});
  return NextResponse.redirect(url.originalUrl, { status: 302 });
}
