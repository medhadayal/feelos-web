export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { signSession, cookieForToken } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

/*
Request body: { email?: string, name?: string }
Response: { user: { id, email, name } }
*/
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body?.email || "").trim() || null;
    const name = (body?.name || "").trim() || null;

    let user: any = null;
    if (process.env.DATABASE_URL) {
      // upsert user by email if provided, otherwise create a guest user
      if (email) {
        user = await prisma.user.upsert({
          where: { email },
          update: { name },
          create: { email, name },
        });
      } else {
        user = await prisma.user.create({ data: { name } });
      }
    } else {
      // no DB configured — create a transient user object
      user = { id: `guest_${Math.random().toString(36).slice(2, 8)}`, email, name };
    }

    const { token, maxAge } = signSession({ userId: user.id });
    const cookie = cookieForToken(token, maxAge);

    const res = NextResponse.json({ user: { id: user.id, email: user.email ?? null, name: user.name ?? null } });
    res.headers.set("Set-Cookie", cookie);
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
