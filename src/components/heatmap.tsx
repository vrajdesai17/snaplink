"use client";

import { useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function toHex(n: number): string {
  return n.toString(16).padStart(2, "0");
}

function cellColor(count: number, max: number): string {
  if (count === 0 || max === 0) return "#18181b";
  const t = Math.pow(count / max, 0.6);
  // Interpolate #312e81 → #7c3aed
  const r = Math.round(49 + (124 - 49) * t);
  const g = Math.round(46 + (58 - 46) * t);
  const b = Math.round(129 + (237 - 129) * t);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Novel: 24×7 click heatmap — hour-of-day × day-of-week.
 * Reveals when a link gets traffic: weekday mornings, Friday nights, etc.
 * Barely any open-source URL shortener has this feature.
 */
export function ClickHeatmap({ heatmap }: { heatmap: number[][] }) {
  const [tooltip, setTooltip] = useState<{
    day: string;
    hour: number;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  const max = Math.max(...heatmap.flat(), 1);
  const totalClicks = heatmap.flat().reduce((a, b) => a + b, 0);

  if (totalClicks === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-zinc-600 text-sm">
        No clicks yet — heatmap will populate once traffic comes in.
      </div>
    );
  }

  return (
    <div className="relative select-none">
      {/* Hour labels */}
      <div className="flex ml-9 mb-1">
        {HOURS.map((h) => (
          <div
            key={h}
            className="flex-1 text-center text-zinc-600"
            style={{ fontSize: 9 }}
          >
            {h % 6 === 0 ? h : ""}
          </div>
        ))}
      </div>

      {/* Grid */}
      {DAYS.map((day, di) => (
        <div key={day} className="flex items-center gap-0.5 mb-0.5">
          <span className="w-8 text-right pr-1.5 text-zinc-500 flex-shrink-0" style={{ fontSize: 10 }}>
            {day}
          </span>
          {HOURS.map((h) => {
            const count = heatmap[di]?.[h] ?? 0;
            return (
              <div
                key={h}
                className="flex-1 rounded-sm cursor-default transition-transform hover:scale-125"
                style={{
                  height: 12,
                  backgroundColor: cellColor(count, max),
                  outline: tooltip?.day === day && tooltip.hour === h ? "1px solid #8b5cf6" : undefined,
                }}
                onMouseEnter={(e) => {
                  const rect = (e.target as HTMLElement).getBoundingClientRect();
                  setTooltip({ day, hour: h, count, x: rect.left, y: rect.top });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })}
        </div>
      ))}

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-xs text-zinc-600">Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <div
            key={t}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: cellColor(t * max, max) }}
          />
        ))}
        <span className="text-xs text-zinc-600">More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-200 shadow-lg"
          style={{ left: tooltip.x + 12, top: tooltip.y - 30 }}
        >
          {tooltip.day} {tooltip.hour}:00 — {tooltip.count} {tooltip.count === 1 ? "click" : "clicks"}
        </div>
      )}
    </div>
  );
}
