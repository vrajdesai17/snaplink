"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { format, parseISO } from "date-fns";

interface DailyClick {
  date: string;
  count: number;
}

export function ClicksLineChart({ data }: { data: DailyClick[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted)
    return <div className="h-[220px] rounded bg-zinc-800/40 animate-pulse" />;

  const thinned = data.filter((_, i) => i % 3 === 0 || i === data.length - 1);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#71717a", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: string) => format(parseISO(v), "MMM d")}
          ticks={thinned.map((d) => d.date)}
        />
        <YAxis
          tick={{ fill: "#71717a", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "#18181b",
            border: "1px solid #27272a",
            borderRadius: "6px",
            color: "#f4f4f5",
            fontSize: 12,
          }}
          labelFormatter={(v: string) => format(parseISO(v), "MMM d, yyyy")}
          formatter={(v: number) => [v, "Clicks"]}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#8b5cf6" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

const COLORS = ["#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6", "#4c1d95"];

export function HorizontalBarChart({
  data,
  labelKey,
  valueKey,
}: {
  data: Record<string, unknown>[];
  labelKey: string;
  valueKey: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted)
    return (
      <div
        className="rounded bg-zinc-800/40 animate-pulse"
        style={{ height: Math.max(120, data.length * 36) }}
      />
    );

  return (
    <ResponsiveContainer width="100%" height={Math.max(120, data.length * 36)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 10, bottom: 0, left: 0 }}
      >
        <XAxis
          type="number"
          tick={{ fill: "#71717a", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey={labelKey}
          tick={{ fill: "#a1a1aa", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={80}
        />
        <Tooltip
          contentStyle={{
            background: "#18181b",
            border: "1px solid #27272a",
            borderRadius: "6px",
            color: "#f4f4f5",
            fontSize: 12,
          }}
          cursor={{ fill: "#27272a" }}
        />
        <Bar dataKey={valueKey} radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
