export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getOrCreateSessionUserId } from "../../../../lib/session";

function errToString(err: unknown) {
  if (err instanceof Error) return err.message;
  return String(err);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const mood = body?.mood;
    const note = body?.note ?? null;

    const { userId, setCookie } = getOrCreateSessionUserId(req);

    if (!mood) {
      const out = NextResponse.json({ error: "invalid" }, { status: 400 });
      if (setCookie) out.headers.set("Set-Cookie", setCookie);
      return out;
    }

    if (!process.env.DATABASE_URL) {
      const entry = { id: Math.random().toString(36).slice(2), userId, mood, note, createdAt: new Date().toISOString() };
      const out = NextResponse.json({ entry });
      if (setCookie) out.headers.set("Set-Cookie", setCookie);
      return out;
    }

    const entry = await prisma.moodEntry.create({ data: { userId, mood, note } });
    const out = NextResponse.json({ entry });
    if (setCookie) out.headers.set("Set-Cookie", setCookie);
    return out;
  } catch (err: unknown) {
    return NextResponse.json({ error: errToString(err) }, { status: 500 });
  }
}
