export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

type Req = { userId: string; company: string; role: string; location?: string; status?: string; jdUrl?: string; notes?: string };

export async function POST(req: Request) {
  try {
    const body: Req = await req.json();
    if (!body?.userId || !body.role || !body.company) return NextResponse.json({ error: "invalid" }, { status: 400 });

    const created = await prisma.jobApplication.create({
      data: {
        userId: body.userId,
        company: body.company,
        role: body.role,
        location: body.location ?? null,
        status: body.status ?? "Applied",
        jdUrl: body.jdUrl ?? null,
        notes: body.notes ?? null,
      },
    });

    return NextResponse.json({ job: created });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
