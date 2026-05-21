import { prisma } from "@/lib/db";
import { subDays, format } from "date-fns";
import Link from "next/link";
import { UrlListClient } from "@/components/url-list-client";
import { ClicksLineChart } from "@/components/stats-chart";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <p className="text-xs text-zinc-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-zinc-100 mt-1">{value}</p>
      {sub && <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  const [totalUrls, totalClicks, urls] = await Promise.all([
    prisma.url.count(),
    prisma.click.count(),
    prisma.url.findMany({
      orderBy: { clickCount: "desc" },
      take: 50,
      select: {
        id: true,
        originalUrl: true,
        shortCode: true,
        createdAt: true,
        expiresAt: true,
        maxClicks: true,
        clickCount: true,
        isActive: true,
        ogTitle: true,
        ogDescription: true,
        ogImage: true,
      },
    }),
  ]);

  const activeUrls = urls.filter((u) => u.isActive).length;

  // Clicks over last 30 days (global)
  const thirtyDaysAgo = subDays(new Date(), 30);
  const recentClicks = await prisma.click.groupBy({
    by: ["clickedAt"],
    where: { clickedAt: { gte: thirtyDaysAgo } },
    _count: { _all: true },
  });

  const dailyMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    dailyMap[format(subDays(new Date(), i), "yyyy-MM-dd")] = 0;
  }
  recentClicks.forEach((r) => {
    const d = format(r.clickedAt, "yyyy-MM-dd");
    if (dailyMap[d] !== undefined) dailyMap[d] += r._count._all;
  });
  const dailyClicks = Object.entries(dailyMap).map(([date, count]) => ({
    date,
    count,
  }));

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayClicks = dailyMap[todayStr] ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
        <Link
          href="/"
          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + New Link
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Links" value={totalUrls} />
        <StatCard label="Total Clicks" value={totalClicks.toLocaleString()} />
        <StatCard label="Active Links" value={activeUrls} />
        <StatCard label="Today" value={todayClicks} sub="clicks" />
      </div>

      {/* Clicks over time */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <h2 className="text-sm font-medium text-zinc-400 mb-4">
          Clicks — last 30 days
        </h2>
        <ClicksLineChart data={dailyClicks} />
      </div>

      {/* All links */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-200">All links</h2>
        <UrlListClient
          initialUrls={urls.map((u) => ({
            ...u,
            createdAt: u.createdAt.toISOString(),
            expiresAt: u.expiresAt?.toISOString() ?? null,
          }))}
          appUrl={APP_URL}
        />
      </div>
    </div>
  );
}
