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
    return { reply: "I can help with your resume: paste a bullet and I'll suggest improvements (quantify impact, add keywords).", suggestedActions: ["Optimize bullet", "Add metrics"] };
  }
  if (lower.includes("interview") || lower.includes("practice")) {
    return { reply: "Let's run a quick mock interview — tell me the role and I'll ask a question.", suggestedActions: ["Start mock interview"] };
  }
  if (lower.includes("anxious") || lower.includes("anxiety")) {
    return { reply: "You sound anxious. Try a 2‑minute grounding: breathe 4s in, hold 4s, out 6s. Want me to guide?", suggestedActions: ["Guide breathing"] };
  }
  const reply =
    `Thanks — here's a short plan:\n\n` +
    `1) Break tasks into 15-minute blocks.\n` +
    `2) Take a 2-minute breathing break.\n` +
    `3) Choose one next action and start it.\n\nWhich would you like to try?`;
  return { reply, suggestedActions: ["Break into blocks", "Do breathing", "Start step"] };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: "invalid request" }, { status: 400 });
    }

    // If MODEL_INFERENCE_URL is set, proxy; otherwise local fallback
    const modelUrl = process.env.MODEL_INFERENCE_URL;
    if (modelUrl) {
      try {
        const r = await fetch(modelUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: body.messages }),
        });
        if (!r.ok) {
          const txt = await r.text().catch(() => "model error");
          return NextResponse.json({ error: "model error", details: txt }, { status: 502 });
        }
        const json = await r.json();
        return NextResponse.json({ reply: json.reply ?? "", suggestedActions: json.suggestedActions ?? [] });
      } catch (err: any) {
        return NextResponse.json({ error: String(err?.message ?? err) }, { status: 502 });
      }
    }

    // local fallback
    const out = localInfer(body.messages);
    return NextResponse.json(out);
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
