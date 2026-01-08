export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { rateLimit } from "../../../../lib/rateLimit";
import { getOrCreateSessionUserId } from "../../../../lib/session";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

function errToString(err: unknown) {
  if (err instanceof Error) return err.message;
  return String(err);
}

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

function isValidRole(v: unknown): v is ChatMessage["role"] {
  return v === "user" || v === "assistant" || v === "system";
}

function normalizeMessages(v: unknown): ChatMessage[] | null {
  if (!Array.isArray(v)) return null;
  const out: ChatMessage[] = [];
  for (const item of v) {
    if (typeof item !== "object" || item === null) return null;
    const rec = item as Record<string, unknown>;
    const role = rec.role;
    const content = rec.content;
    if (!isValidRole(role)) return null;
    if (typeof content !== "string") return null;
    const c = content.trim();
    if (!c) continue;
    out.push({ role, content: c });
  }
  return out.length ? out.slice(-50) : [];
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 25_000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

function cap(s: string, max = 2000) {
  if (s.length <= max) return s;
  return s.slice(0, max) + "…";
}

export async function POST(req: Request) {
  try {
    const rl = rateLimit(req, { key: "api:ai-infer", limit: 20, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetMs - Date.now()) / 1000)) } }
      );
    }

    const { setCookie } = getOrCreateSessionUserId(req);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "invalid request" }, { status: 400 });
    }

    const messages = normalizeMessages((body as { messages?: unknown }).messages);
    if (!messages) {
      return NextResponse.json({ error: "invalid messages" }, { status: 400 });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    const modelUrl = process.env.MODEL_INFERENCE_URL;

    if (openaiKey) {
      try {
        const r = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages,
            temperature: 0.3,
            max_tokens: 800,
          }),
        });
        if (!r.ok) {
          const txt = await r.text().catch(() => "openai error");
          let userMessage = "AI service error";
          try {
            JSON.parse(txt);
            if (r.status === 401) userMessage = "AI service authentication failed.";
            if (r.status === 429) userMessage = "Too many requests. Please wait a moment.";
            if (r.status === 500 || r.status === 503) userMessage = "AI service temporarily unavailable.";
          } catch {}
          return NextResponse.json(
            { error: userMessage, details: cap(txt), upstreamStatus: r.status },
            { status: 502 }
          );
        }
        const json = await r.json();
        const reply = json?.choices?.[0]?.message?.content ?? "";
        const out = NextResponse.json({ reply, suggestedActions: [] });
        if (setCookie) out.headers.set("Set-Cookie", setCookie);
        return out;
      } catch (err: unknown) {
        return NextResponse.json({ error: "openai request failed", details: errToString(err) }, { status: 502 });
      }
    }

    if (modelUrl) {
      try {
        const r = await fetchWithTimeout(modelUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages, options: (body as { options?: unknown }).options ?? {} }),
        });
        if (!r.ok) {
          const txt = await r.text().catch(() => "model error");
          return NextResponse.json({ error: "model inference failed", details: cap(txt) }, { status: 502 });
        }
        const json = await r.json();
        const out = NextResponse.json({ reply: json.reply ?? "", suggestedActions: json.suggestedActions ?? [] });
        if (setCookie) out.headers.set("Set-Cookie", setCookie);
        return out;
      } catch (err: unknown) {
        return NextResponse.json({ error: "model proxy failed", details: errToString(err) }, { status: 502 });
      }
    }

    const out = NextResponse.json(localInfer(messages));
    if (setCookie) out.headers.set("Set-Cookie", setCookie);
    return out;
  } catch (err: unknown) {
    return NextResponse.json({ error: errToString(err) }, { status: 500 });
  }
}
