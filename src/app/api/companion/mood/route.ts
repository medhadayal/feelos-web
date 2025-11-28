export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = body?.userId;
    const mood = body?.mood;
    const note = body?.note ?? null;
    if (!userId || !mood) return NextResponse.json({ error: "invalid" }, { status: 400 });

    if (!process.env.DATABASE_URL) {
      const entry = { id: Math.random().toString(36).slice(2), userId, mood, note, createdAt: new Date().toISOString() };
      return NextResponse.json({ entry });
    }

    const entry = await prisma.moodEntry.create({ data: { userId, mood, note } });
    return NextResponse.json({ entry });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
