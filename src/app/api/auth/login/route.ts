export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { signSession, cookieForToken } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

function errToString(err: unknown) {
  if (err instanceof Error) return err.message;
  return String(err);
}

type UserLike = { id: string; email?: string | null; name?: string | null };

/*
Request body: { email?: string, name?: string }
Response: { user: { id, email, name } }
*/
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body?.email || "").trim() || null;
    const name = (body?.name || "").trim() || null;
    const isProd = process.env.NODE_ENV === "production";

    let user: UserLike | null = null;
    if (process.env.DATABASE_URL) {
      // Public launch safety: without verified email auth, never allow "login as <email>".
      // In production we always create a new user and ignore email to prevent impersonation.
      if (isProd) {
        user = await prisma.user.create({ data: { name, email: null } });
      } else if (email) {
        // dev convenience: upsert user by email
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

    if (!user?.id) {
      return NextResponse.json({ error: "login failed" }, { status: 500 });
    }

    const { token, maxAge } = signSession({ userId: user.id });
    const cookie = cookieForToken(token, maxAge);

    const res = NextResponse.json({ user: { id: user.id, email: user.email ?? null, name: user.name ?? null } });
    res.headers.set("Set-Cookie", cookie);
    return res;
  } catch (err: unknown) {
    return NextResponse.json({ error: errToString(err) }, { status: 500 });
  }
}
