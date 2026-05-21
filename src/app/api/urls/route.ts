import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json([]);
  }

  const urls = await prisma.url.findMany({
    where: { userId: session.user.id },
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
