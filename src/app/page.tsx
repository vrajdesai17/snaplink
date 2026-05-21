import { UrlForm } from "@/components/url-form";
import { UrlListClient } from "@/components/url-list-client";
import { auth, signIn } from "@/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const FEATURES = [
  {
    icon: "⚡",
    title: "Semantic slugs",
    desc: "Auto-generates readable codes like gh-nextjs instead of random gibberish.",
  },
  {
    icon: "🗺",
    title: "24×7 heatmap",
    desc: "See exactly which hour and day your audience clicks — unique to SnapLink.",
  },
  {
    icon: "🔥",
    title: "Burn-after-N links",
    desc: "Links that self-destruct after N clicks or a set date.",
  },
  {
    icon: "📊",
    title: "Click analytics",
    desc: "Geo, browser, device, and referrer breakdown for every link.",
  },
];

function LandingPage() {
  return (
    <div className="space-y-20 py-8">
      {/* Hero */}
      <section className="text-center space-y-8 max-w-3xl mx-auto">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Free · No credit card required
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight">
            Short links that{" "}
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              tell a story
            </span>
          </h1>
          <p className="text-zinc-400 text-lg sm:text-xl max-w-xl mx-auto leading-relaxed">
            Intelligent semantic slugs, geolocation analytics, and a 24×7 traffic
            heatmap — everything Bitly doesn't give you for free.
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="inline-flex items-center gap-3 px-6 py-3.5 bg-white hover:bg-zinc-100 text-zinc-900 font-semibold rounded-xl transition-colors text-base shadow-lg"
          >
            <svg width="20" height="20" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>
        </form>

        <p className="text-zinc-600 text-sm">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-violet-400 hover:underline">
            Sign in
          </Link>
        </p>
      </section>

      {/* Feature grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-2 hover:border-zinc-700 transition-colors"
          >
            <div className="text-2xl">{f.icon}</div>
            <h3 className="font-semibold text-zinc-100">{f.title}</h3>
            <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Social proof strip */}
      <section className="text-center space-y-2">
        <p className="text-xs text-zinc-600 uppercase tracking-widest">Built with</p>
        <div className="flex items-center justify-center gap-6 text-zinc-500 text-sm flex-wrap">
          <span>Next.js 16</span>
          <span>·</span>
          <span>PostgreSQL</span>
          <span>·</span>
          <span>Redis</span>
          <span>·</span>
          <span>Prisma</span>
          <span>·</span>
          <span>Vercel</span>
        </div>
      </section>
    </div>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await auth();

  if (!session?.user) return <LandingPage />;

  const recentUrls = await prisma.url.findMany({
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
  });

  const errorMessages: Record<string, string> = {
    "not-found": "That short link doesn't exist.",
    expired: "That link has expired.",
    maxed: "That link has reached its click limit.",
  };

  return (
    <div className="space-y-10">
      <section className="text-center space-y-6 pt-6">
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            <span className="text-white">Shorten.</span>{" "}
            <span className="text-zinc-400">Track.</span>{" "}
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              Analyze.
            </span>
          </h1>
          <p className="text-zinc-500 text-base">
            Welcome back, {session.user.name?.split(" ")[0]} 👋
          </p>
        </div>

        {error && errorMessages[error] && (
          <div className="inline-block px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-sm">
            {errorMessages[error]}
          </div>
        )}

        <UrlForm />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-200">Your recent links</h2>
          <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-violet-400 transition-colors">
            View all →
          </Link>
        </div>
        {recentUrls.length > 0 ? (
          <UrlListClient
            initialUrls={recentUrls.map((u) => ({
              ...u,
              createdAt: u.createdAt.toISOString(),
              expiresAt: u.expiresAt?.toISOString() ?? null,
            }))}
            appUrl={APP_URL}
          />
        ) : (
          <p className="text-zinc-600 text-sm text-center py-8">
            No links yet — shorten your first URL above.
          </p>
        )}
      </section>
    </div>
  );
}
