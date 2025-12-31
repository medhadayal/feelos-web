export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getOrCreateSessionUserId } from "../../../../lib/session";

type Req = { userId?: string; company: string; role: string; location?: string; status?: string; jdUrl?: string; notes?: string };

function errToString(err: unknown) {
  if (err instanceof Error) return err.message;
  return String(err);
}

export async function POST(req: Request) {
  try {
    const body: Req = await req.json();
    const { userId, setCookie } = getOrCreateSessionUserId(req);
    if (!body?.role || !body?.company) {
      const out = NextResponse.json({ error: "invalid" }, { status: 400 });
      if (setCookie) out.headers.set("Set-Cookie", setCookie);
      return out;
    }

    const created = await prisma.jobApplication.create({
      data: {
        userId,
        company: body.company,
        role: body.role,
        location: body.location ?? null,
        status: body.status ?? "Applied",
        jdUrl: body.jdUrl ?? null,
        notes: body.notes ?? null,
      },
    });

    const out = NextResponse.json({ job: created });
    if (setCookie) out.headers.set("Set-Cookie", setCookie);
    return out;
  } catch (err: unknown) {
    return NextResponse.json({ error: errToString(err) }, { status: 500 });
  }
}
