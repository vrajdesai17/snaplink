"use client";

import { useState } from "react";
import { UrlCard } from "./url-card";

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

export function UrlListClient({
  initialUrls,
  appUrl,
}: {
  initialUrls: UrlData[];
  appUrl: string;
}) {
  const [urls, setUrls] = useState(initialUrls);

  function handleDelete(code: string) {
    setUrls((prev) => prev.filter((u) => u.shortCode !== code));
  }

  if (urls.length === 0) {
    return (
      <p className="text-zinc-600 text-sm text-center py-8">
        No links yet. Shorten your first URL above.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {urls.map((url) => (
        <UrlCard
          key={url.id}
          url={url}
          appUrl={appUrl}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
