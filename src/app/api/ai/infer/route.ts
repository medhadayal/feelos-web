export const runtime = "nodejs";

import { NextResponse } from "next/server";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

function localInfer(messages: ChatMessage[]) {
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const lower = lastUser.toLowerCase();
  if (!lastUser.trim()) {
    return { reply: "Hello — tell me what's on your mind and I'll help you break it down.", suggestedActions: ["Log mood", "Plan day"] };
  }
  if (lower.includes("resume") || lower.includes("cv")) {
    return { reply: "Paste a key bullet and I'll suggest improvements (quantify, add role keywords).", suggestedActions: ["Optimize bullet"] };
  }
  if (lower.includes("interview")) {
    return { reply: "Let's do a short mock interview: tell me the role and I'll ask a question.", suggestedActions: ["Start mock interview"] };
  }
  if (lower.includes("anxious") || lower.includes("anxiety")) {
    return { reply: "Try a 2‑minute grounding: breathe 4s in, hold 4s, exhale 6s. Want me to guide?", suggestedActions: ["Guide breathing"] };
  }
  return { reply: "Plan: 1) 15‑minute task blocks 2) 2‑minute breathing 3) Define one next step. Which first?" };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: "invalid request" }, { status: 400 });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    const modelUrl = process.env.MODEL_INFERENCE_URL;

    if (openaiKey) {
      try {
        const r = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
          body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4o-mini", messages: body.messages, temperature: 0.3, max_tokens: 800 }),
        });
        if (!r.ok) {
          const txt = await r.text().catch(() => "openai error");
          return NextResponse.json({ error: "openai error", details: txt }, { status: r.status });
        }
        const json = await r.json();
        const reply = json?.choices?.[0]?.message?.content ?? "";
        return NextResponse.json({ reply, suggestedActions: [] });
      } catch (err: any) {
        return NextResponse.json({ error: String(err?.message ?? err) }, { status: 502 });
      }
    }

    if (modelUrl) {
      try {
        const r = await fetch(modelUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: body.messages, options: body.options ?? {} }),
        });
        if (!r.ok) {
          const txt = await r.text().catch(() => "model error");
          return NextResponse.json({ error: "model inference failed", details: txt }, { status: 502 });
        }
        const json = await r.json();
        return NextResponse.json({ reply: json.reply ?? "", suggestedActions: json.suggestedActions ?? [] });
      } catch (err: any) {
        return NextResponse.json({ error: "model proxy failed", details: String(err?.message ?? err) }, { status: 502 });
      }
    }

    return NextResponse.json(localInfer(body.messages));
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
