import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { cacheDel } from "@/lib/redis";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const session = await auth();

  const url = await prisma.url.findUnique({ where: { shortCode: code } });
  if (!url) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (url.userId && url.userId !== session?.user?.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  await prisma.url.delete({ where: { shortCode: code } });
  await cacheDel(`url:${code}`);

  return NextResponse.json({ success: true });
}
