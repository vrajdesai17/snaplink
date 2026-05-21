import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { subDays, format } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UrlListClient } from "@/components/url-list-client";
import { ClicksLineChart } from "@/components/stats-chart";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <p className="text-xs text-zinc-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-zinc-100 mt-1">{value}</p>
      {sub && <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const userId = session.user.id;

  const [urls, totalClicks] = await Promise.all([
    prisma.url.findMany({
      where: { userId },
      orderBy: { clickCount: "desc" },
      take: 100,
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
    prisma.click.count({
      where: { url: { userId } },
    }),
  ]);

  const activeUrls = urls.filter((u) => u.isActive).length;

  const thirtyDaysAgo = subDays(new Date(), 30);
  const recentClicks = await prisma.click.findMany({
    where: {
      url: { userId },
      clickedAt: { gte: thirtyDaysAgo },
    },
    select: { clickedAt: true },
  });

  const dailyMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    dailyMap[format(subDays(new Date(), i), "yyyy-MM-dd")] = 0;
  }
  recentClicks.forEach((c) => {
    const d = format(c.clickedAt, "yyyy-MM-dd");
    if (dailyMap[d] !== undefined) dailyMap[d]++;
  });
  const dailyClicks = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));
  const todayClicks = dailyMap[format(new Date(), "yyyy-MM-dd")] ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{session.user.email}</p>
        </div>
        <Link
          href="/"
          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + New Link
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Links" value={urls.length} />
        <StatCard label="Total Clicks" value={totalClicks.toLocaleString()} />
        <StatCard label="Active Links" value={activeUrls} />
        <StatCard label="Today" value={todayClicks} sub="clicks" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <h2 className="text-sm font-medium text-zinc-400 mb-4">Clicks — last 30 days</h2>
        <ClicksLineChart data={dailyClicks} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-200">Your links</h2>
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
