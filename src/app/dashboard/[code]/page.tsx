import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { ClicksLineChart, HorizontalBarChart } from "@/components/stats-chart";
import { ClickHeatmap } from "@/components/heatmap";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

interface StatsResponse {
  url: {
    id: number;
    originalUrl: string;
    shortCode: string;
    createdAt: string;
    expiresAt: string | null;
    maxClicks: number | null;
    clickCount: number;
    isActive: boolean;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
  };
  dailyClicks: { date: string; count: number }[];
  countries: { country: string; count: number }[];
  browsers: { browser: string; count: number }[];
  devices: { device: string; count: number }[];
  heatmap: number[][];
  totalClicks: number;
  todayClicks: number;
}

async function getStats(code: string): Promise<StatsResponse | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/urls/${code}/stats`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-center">
      <p className="text-xl font-bold text-zinc-100">{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
    </div>
  );
}

export default async function UrlStatsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const data = await getStats(code);
  if (!data) notFound();

  const { url, dailyClicks, countries, browsers, devices, heatmap, totalClicks, todayClicks } = data;
  const shortUrl = `${APP_URL}/${url.shortCode}`;

  return (
    <div className="space-y-8">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        ← Dashboard
      </Link>

      {/* URL info card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex gap-4">
        {url.ogImage && (
          <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-zinc-800">
            <Image
              src={url.ogImage}
              alt=""
              width={80}
              height={80}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
        )}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-violet-400 font-semibold text-lg">
              {shortUrl}
            </span>
            <span
              className={`px-2 py-0.5 text-xs rounded ${
                url.isActive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {url.isActive ? "active" : "inactive"}
            </span>
          </div>
          {url.ogTitle && (
            <p className="text-zinc-300 font-medium truncate">{url.ogTitle}</p>
          )}
          <p className="text-sm text-zinc-500 truncate">
            {url.originalUrl}
          </p>
          <div className="flex gap-4 text-xs text-zinc-600 flex-wrap">
            <span>Created {format(new Date(url.createdAt), "MMM d, yyyy")}</span>
            {url.expiresAt && (
              <span>Expires {format(new Date(url.expiresAt), "MMM d, yyyy HH:mm")}</span>
            )}
            {url.maxClicks !== null && (
              <span>
                {url.clickCount}/{url.maxClicks} clicks (burn limit)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats pills */}
      <div className="grid grid-cols-3 gap-3">
        <StatPill label="Total clicks" value={totalClicks.toLocaleString()} />
        <StatPill label="Today" value={todayClicks} />
        <StatPill
          label="Countries"
          value={countries.length}
        />
      </div>

      {/* Clicks over time */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <h2 className="text-sm font-medium text-zinc-400 mb-4">
          Clicks — last 30 days
        </h2>
        <ClicksLineChart data={dailyClicks} />
      </div>

      {/* 24×7 Heatmap */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-sm font-medium text-zinc-300">
              24×7 Traffic Heatmap
            </h2>
            <p className="text-xs text-zinc-600 mt-0.5">
              Hour of day (UTC) × day of week. Reveals <em>when</em> your audience clicks.
            </p>
          </div>
        </div>
        <ClickHeatmap heatmap={heatmap} />
      </div>

      {/* Geo + Browser */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <h2 className="text-sm font-medium text-zinc-400 mb-4">
            Countries
          </h2>
          {countries.length > 0 ? (
            <HorizontalBarChart
              data={countries}
              labelKey="country"
              valueKey="count"
            />
          ) : (
            <p className="text-zinc-600 text-sm">No geo data yet.</p>
          )}
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <h2 className="text-sm font-medium text-zinc-400 mb-4">
            Browsers
          </h2>
          {browsers.length > 0 ? (
            <HorizontalBarChart
              data={browsers}
              labelKey="browser"
              valueKey="count"
            />
          ) : (
            <p className="text-zinc-600 text-sm">No browser data yet.</p>
          )}
        </div>
      </div>

      {/* Devices */}
      {devices.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <h2 className="text-sm font-medium text-zinc-400 mb-4">Devices</h2>
          <HorizontalBarChart
            data={devices}
            labelKey="device"
            valueKey="count"
          />
        </div>
      )}
    </div>
  );
}
