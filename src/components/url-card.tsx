"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

interface UrlData {
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
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function StatusBadge({ url }: { url: UrlData }) {
  if (!url.isActive) {
    return (
      <span className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-500 rounded">
        inactive
      </span>
    );
  }
  if (url.expiresAt && new Date(url.expiresAt) < new Date()) {
    return (
      <span className="px-2 py-0.5 text-xs bg-amber-500/10 text-amber-500 rounded">
        expired
      </span>
    );
  }
  if (url.maxClicks !== null && url.clickCount >= url.maxClicks) {
    return (
      <span className="px-2 py-0.5 text-xs bg-orange-500/10 text-orange-400 rounded">
        maxed
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-400 rounded">
      active
    </span>
  );
}

export function UrlCard({
  url,
  appUrl,
  onDelete,
}: {
  url: UrlData;
  appUrl: string;
  onDelete: (code: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const shortUrl = `${appUrl}/${url.shortCode}`;

  async function handleDelete() {
    if (!confirm("Delete this link?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/urls/${url.shortCode}`, { method: "DELETE" });
      onDelete(url.shortCode);
    } finally {
      setDeleting(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors group">
      {url.ogImage ? (
        <div className="w-14 h-14 flex-shrink-0 rounded overflow-hidden bg-zinc-800">
          <Image
            src={url.ogImage}
            alt=""
            width={56}
            height={56}
            className="w-full h-full object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="w-14 h-14 flex-shrink-0 rounded bg-zinc-800 flex items-center justify-center text-zinc-600 text-xs font-mono">
          {getDomain(url.originalUrl).slice(0, 3)}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-violet-400 text-sm font-medium">
            /{url.shortCode}
          </span>
          <StatusBadge url={url} />
          {url.maxClicks !== null && (
            <span className="text-xs text-zinc-600">
              {url.clickCount}/{url.maxClicks} clicks
            </span>
          )}
        </div>
        <p className="text-sm text-zinc-300 truncate mt-0.5">
          {url.ogTitle || getDomain(url.originalUrl)}
        </p>
        <p className="text-xs text-zinc-600 truncate">{url.originalUrl}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-xs text-zinc-600">
            {formatDistanceToNow(new Date(url.createdAt), { addSuffix: true })}
          </span>
          <span className="text-xs text-zinc-500">
            {url.clickCount} {url.clickCount === 1 ? "click" : "clicks"}
          </span>
        </div>
      </div>

      <div className="flex items-start gap-1 flex-shrink-0">
        <button
          onClick={copy}
          className="p-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Copy short URL"
        >
          {copied ? "✓" : "⎘"}
        </button>
        <Link
          href={`/dashboard/${url.shortCode}`}
          className="p-1.5 text-xs text-zinc-500 hover:text-violet-400 transition-colors"
          title="View analytics"
        >
          ↗
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 text-xs text-zinc-700 hover:text-red-400 transition-colors disabled:opacity-50"
          title="Delete"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
