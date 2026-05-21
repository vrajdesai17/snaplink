import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { AuthNav } from "@/components/auth-nav";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "SnapLink — URL Shortener & Analytics",
  description:
    "Shorten URLs with intelligent semantic slugs, track clicks with geo analytics, and monitor traffic patterns with a 24×7 heatmap.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased">
        <nav className="border-b border-zinc-800/60 sticky top-0 z-40 backdrop-blur-sm bg-zinc-950/80">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-semibold text-zinc-100 hover:text-white transition-colors">
              <span className="text-violet-500 font-mono text-lg">⚡</span>
              SnapLink
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                Dashboard
              </Link>
              <AuthNav />
            </div>
          </div>
        </nav>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">{children}</div>
      </body>
    </html>
  );
}
