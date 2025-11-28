export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };
type ChatRequest = { userId: string; messages: ChatMessage[]; moodSnapshot?: { mood?: string } };

async function persistMessage(userId: string, role: string, content: string) {
  try {
    if (!process.env.DATABASE_URL) return null;
    return await prisma.conversationMessage.create({ data: { userId, role, content } });
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body: ChatRequest = await req.json();
    if (!body?.userId || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // persist user messages
    for (const m of body.messages.filter((x) => x.role === "user")) {
      await persistMessage(body.userId, m.role, m.content);
    }

    // call internal inference
    const base = process.env.BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
    const res = await fetch(new URL("/api/ai/infer", base).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: body.messages }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      const fallback = { reply: `Fallback: inference failed (${txt})`, suggestedActions: [] };
      await persistMessage(body.userId, "assistant", fallback.reply);
      return NextResponse.json(fallback, { status: 502 });
    }

    const json = await res.json();
    const reply: string = json.reply ?? "";
    const suggestedActions: string[] = json.suggestedActions ?? [];

    await persistMessage(body.userId, "assistant", reply);

    return NextResponse.json({ reply, suggestedActions });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
