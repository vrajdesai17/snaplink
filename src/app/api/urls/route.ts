import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const urls = await prisma.url.findMany({
    orderBy: { createdAt: "desc" },
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
  });

  return NextResponse.json(urls);
}
