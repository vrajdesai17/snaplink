import { UrlForm } from "@/components/url-form";
import { UrlListClient } from "@/components/url-list-client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await auth();

  const recentUrls = session?.user?.id
    ? await prisma.url.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
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
      })
    : [];

  const errorMessages: Record<string, string> = {
    "not-found": "That short link doesn't exist.",
    expired: "That link has expired.",
    maxed: "That link has reached its click limit.",
  };

  return (
    <div className="space-y-12">
      <section className="text-center space-y-6 pt-8 pb-4">
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            <span className="text-white">Shorten.</span>{" "}
            <span className="text-zinc-400">Track.</span>{" "}
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              Analyze.
            </span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Intelligent semantic slugs, live click analytics, geolocation tracking,
            and a 24×7 traffic heatmap — in one link.
          </p>
        </div>

        {error && errorMessages[error] && (
          <div className="inline-block px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-sm">
            {errorMessages[error]}
          </div>
        )}

        <UrlForm />

        <div className="flex items-center justify-center gap-6 text-xs text-zinc-600">
          <span>⚡ Semantic slugs</span>
          <span>•</span>
          <span>📊 Click analytics</span>
          <span>•</span>
          <span>🔥 Burn-after-N links</span>
          <span>•</span>
          <span>🗺 24×7 heatmap</span>
        </div>
      </section>

      {session?.user ? (
        recentUrls.length > 0 ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-200">Your recent links</h2>
              <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-violet-400 transition-colors">
                View all →
              </Link>
            </div>
            <UrlListClient
              initialUrls={recentUrls.map((u) => ({
                ...u,
                createdAt: u.createdAt.toISOString(),
                expiresAt: u.expiresAt?.toISOString() ?? null,
              }))}
              appUrl={APP_URL}
            />
          </section>
        ) : (
          <p className="text-center text-zinc-600 text-sm">
            No links yet — shorten your first URL above.
          </p>
        )
      ) : (
        <div className="text-center py-8 space-y-3">
          <p className="text-zinc-500 text-sm">
            <Link href="/auth/signin" className="text-violet-400 hover:underline">
              Sign in with Google
            </Link>{" "}
            to save links and see your personal dashboard.
          </p>
        </div>
      )}
    </div>
  );
}
