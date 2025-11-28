export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getTokenFromCookie, verifySession } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get("cookie") ?? "";
    const token = getTokenFromCookie(cookie);
    const v = verifySession(token);
    if (!v.valid || !v.payload?.userId) return NextResponse.json({ user: null });
    const userId = v.payload.userId;
    if (process.env.DATABASE_URL) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return NextResponse.json({ user: null });
      return NextResponse.json({ user: { id: user.id, email: user.email ?? null, name: user.name ?? null } });
    }
    return NextResponse.json({ user: { id: userId, email: null, name: "Guest" } });
  } catch (err: any) {
    return NextResponse.json({ user: null, error: String(err?.message ?? err) }, { status: 500 });
  }
}
