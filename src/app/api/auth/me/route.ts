export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getTokenFromCookie, verifySession } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

function errToString(err: unknown) {
  if (err instanceof Error) return err.message;
  return String(err);
}

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get("cookie") ?? "";
    const token = getTokenFromCookie(cookie);
    const v = verifySession(token ?? undefined);
    if (!v.valid || !v.payload?.userId) return NextResponse.json({ user: null });
    const userId = v.payload.userId;
    if (process.env.DATABASE_URL) {
      let user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        try {
          user = await prisma.user.create({ data: { id: userId, name: "Guest", email: null } });
        } catch {
          return NextResponse.json({ user: null });
        }
      }
      return NextResponse.json({ user: { id: user.id, email: user.email ?? null, name: user.name ?? null } });
    }
    return NextResponse.json({ user: { id: userId, email: null, name: "Guest" } });
  } catch (err: unknown) {
    return NextResponse.json({ user: null, error: errToString(err) }, { status: 500 });
  }
}
