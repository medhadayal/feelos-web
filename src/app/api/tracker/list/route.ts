export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getOrCreateSessionUserId } from "../../../../lib/session";

function errToString(err: unknown) {
  if (err instanceof Error) return err.message;
  return String(err);
}

export async function GET(req: Request) {
  try {
    const { userId, setCookie } = getOrCreateSessionUserId(req);

    const jobs = await prisma.jobApplication.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    const out = NextResponse.json({ jobs });
    if (setCookie) out.headers.set("Set-Cookie", setCookie);
    return out;
  } catch (err: unknown) {
    return NextResponse.json({ error: errToString(err) }, { status: 500 });
  }
}
