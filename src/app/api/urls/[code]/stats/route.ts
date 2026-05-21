import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { subDays, format } from "date-fns";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const url = await prisma.url.findUnique({
    where: { shortCode: code },
    include: { _count: { select: { clicks: true } } },
  });

  if (!url) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const thirtyDaysAgo = subDays(new Date(), 30);
  const clicks = await prisma.click.findMany({
    where: { urlId: url.id, clickedAt: { gte: thirtyDaysAgo } },
    select: {
      clickedAt: true,
      country: true,
      browser: true,
      device: true,
      os: true,
      hourOfDay: true,
      dayOfWeek: true,
    },
  });

  // Daily aggregation (last 30 days)
  const dailyMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    dailyMap[format(subDays(new Date(), i), "yyyy-MM-dd")] = 0;
  }
  clicks.forEach((c) => {
    const d = format(c.clickedAt, "yyyy-MM-dd");
    if (dailyMap[d] !== undefined) dailyMap[d]++;
  });
  const dailyClicks = Object.entries(dailyMap).map(([date, count]) => ({
    date,
    count,
  }));

  // Country breakdown
  const countryMap: Record<string, number> = {};
  clicks.forEach((c) => {
    if (c.country) countryMap[c.country] = (countryMap[c.country] ?? 0) + 1;
  });
  const countries = Object.entries(countryMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([country, count]) => ({ country, count }));

  // Browser breakdown
  const browserMap: Record<string, number> = {};
  clicks.forEach((c) => {
    if (c.browser) browserMap[c.browser] = (browserMap[c.browser] ?? 0) + 1;
  });
  const browsers = Object.entries(browserMap)
    .sort(([, a], [, b]) => b - a)
    .map(([browser, count]) => ({ browser, count }));

  // Device breakdown
  const deviceMap: Record<string, number> = {};
  clicks.forEach((c) => {
    if (c.device) deviceMap[c.device] = (deviceMap[c.device] ?? 0) + 1;
  });
  const devices = Object.entries(deviceMap)
    .sort(([, a], [, b]) => b - a)
    .map(([device, count]) => ({ device, count }));

  // 24×7 heatmap — rows: Mon–Sun (0–6), cols: hours 0–23
  // Sun (dayOfWeek=0) maps to index 6 so Mon is always first
  const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  clicks.forEach((c) => {
    if (c.dayOfWeek !== null && c.hourOfDay !== null) {
      const row = c.dayOfWeek === 0 ? 6 : c.dayOfWeek - 1;
      heatmap[row][c.hourOfDay]++;
    }
  });

  // Today's click count
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayClicks = dailyMap[todayStr] ?? 0;

  return NextResponse.json({
    url: {
      id: url.id,
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      createdAt: url.createdAt,
      expiresAt: url.expiresAt,
      maxClicks: url.maxClicks,
      clickCount: url.clickCount,
      isActive: url.isActive,
      ogTitle: url.ogTitle,
      ogDescription: url.ogDescription,
      ogImage: url.ogImage,
    },
    dailyClicks,
    countries,
    browsers,
    devices,
    heatmap,
    totalClicks: url._count.clicks,
    todayClicks,
  });
}
