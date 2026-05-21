import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheDel } from "@/lib/redis";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const url = await prisma.url.findUnique({ where: { shortCode: code } });
  if (!url) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  await prisma.url.delete({ where: { shortCode: code } });
  await cacheDel(`url:${code}`);

  return NextResponse.json({ success: true });
}
