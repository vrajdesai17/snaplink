"use client";

import { useState } from "react";
import Link from "next/link";

interface ShortenResult {
  shortUrl: string;
  shortCode: string;
  ogTitle: string | null;
  ogImage: string | null;
}

export function UrlForm() {
  const [url, setUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxClicks, setMaxClicks] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ShortenResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          customSlug: customSlug || undefined,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
          maxClicks: maxClicks ? parseInt(maxClicks, 10) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setResult(data);
        setUrl("");
        setCustomSlug("");
        setExpiresAt("");
        setMaxClicks("");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-very-long-url.com/paste/it/here"
            required
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            {loading ? "Shortening…" : "Shorten →"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
        >
          <span>{showAdvanced ? "▾" : "▸"}</span> Advanced options
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Custom slug</label>
              <input
                type="text"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
                placeholder="my-link"
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Expires at</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-violet-500 transition-colors [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Max clicks (burn)</label>
              <input
                type="number"
                value={maxClicks}
                onChange={(e) => setMaxClicks(e.target.value)}
                placeholder="e.g. 100"
                min={1}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>
        )}
      </form>

      {error && (
        <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-zinc-900 border border-violet-500/30 rounded-lg space-y-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-violet-400 text-lg font-semibold flex-1 truncate">
              {result.shortUrl}
            </span>
            <button
              onClick={() => copyToClipboard(result.shortUrl)}
              className="px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors whitespace-nowrap"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <Link
              href={`/dashboard/${result.shortCode}`}
              className="px-3 py-1.5 text-sm bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 rounded transition-colors whitespace-nowrap"
            >
              Stats →
            </Link>
          </div>
          {result.ogTitle && (
            <p className="text-sm text-zinc-500 truncate">{result.ogTitle}</p>
          )}
        </div>
      )}
    </div>
  );
}
