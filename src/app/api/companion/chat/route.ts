export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getOrCreateSessionUserId } from "../../../../lib/session";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };
type ChatRequest = { userId?: string; messages: ChatMessage[]; moodSnapshot?: { mood?: string } };

function errToString(err: unknown) {
  if (err instanceof Error) return err.message;
  return String(err);
}

function localAssistantReply(userText: string, mood = "neutral") {
  const lower = (userText || "").toLowerCase();
  if (!userText.trim()) return "Hi — tell me what you want help with and I'll suggest a plan.";
  if (lower.includes("resume") || lower.includes("cv")) return "I can help with your resume: paste a bullet or job and I'll suggest improvements (quantify impact, add keywords).";
  if (lower.includes("interview") || lower.includes("practice")) return "We can run a quick mock interview. Share the role and I'll ask a common question.";
  if (lower.includes("anxious") || mood === "concerned") return "It sounds like you're feeling anxious. Try a 2‑minute grounding exercise: 4s in, 4s hold, 6s out. Want me to guide you?";
  return `Thanks for sharing. Try these quick steps:\n\n• Break the task into 15‑minute chunks\n• Take a 2‑minute breathing break\n• Write one concrete next action and do it now\n\nWhich would you like to try?`;
}

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
    if (!Array.isArray(body?.messages)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { userId, setCookie } = getOrCreateSessionUserId(req);

    // persist user messages (best-effort)
    for (const m of body.messages.filter((x) => x.role === "user")) {
      await persistMessage(userId, m.role, m.content);
    }

    // call internal inference (uses OpenAI if key set, else local)
    const inferUrl = new URL("/api/ai/infer", req.url);
    const res = await fetch(inferUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: body.messages, options: { mood: body.moodSnapshot?.mood } }),
    });

    if (!res.ok) {
      // fallback local deterministic reply
      const lastUser = [...body.messages].reverse().find((m) => m.role === "user")?.content ?? "";
      const reply = localAssistantReply(lastUser, body.moodSnapshot?.mood ?? "neutral");
      await persistMessage(userId, "assistant", reply);
      const out = NextResponse.json({ reply, suggestedActions: [] });
      if (setCookie) out.headers.set("Set-Cookie", setCookie);
      return out;
    }

    const json = await res.json();
    const reply: string = json.reply ?? "";
    const suggestedActions: string[] = json.suggestedActions ?? [];

    await persistMessage(userId, "assistant", reply);
    const out = NextResponse.json({ reply, suggestedActions });
    if (setCookie) out.headers.set("Set-Cookie", setCookie);
    return out;
  } catch (err: unknown) {
    return NextResponse.json({ error: errToString(err) }, { status: 500 });
  }
}
