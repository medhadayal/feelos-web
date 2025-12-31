import { NextResponse } from "next/server";
import { rateLimit } from "../../../lib/rateLimit";
import { getOrCreateSessionUserId } from "../../../lib/session";

function errToString(err: unknown) {
  if (err instanceof Error) return err.message;
  return String(err);
}

function isValidMessages(v: unknown): v is Array<{ role: string; content: string }> {
  if (!Array.isArray(v)) return false;
  for (const item of v) {
    if (typeof item !== "object" || item === null) return false;
    const rec = item as Record<string, unknown>;
    if (typeof rec.role !== "string") return false;
    if (typeof rec.content !== "string") return false;
  }
  return true;
}

export async function POST(req: Request) {
  try {
    const rl = rateLimit(req, { key: "api:chat", limit: 20, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetMs - Date.now()) / 1000)) } }
      );
    }

    const { setCookie } = getOrCreateSessionUserId(req);

    const body = await req.json().catch(() => null);
    const messages = body && typeof body === "object" ? (body as { messages?: unknown }).messages : undefined;
    if (!isValidMessages(messages)) return NextResponse.json({ error: "messages required" }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages,
        max_tokens: 800,
        temperature: 0.8,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "OpenAI error");
      return NextResponse.json({ error: "OpenAI error", details: text }, { status: res.status });
    }

    const data = await res.json();
    const assistant = data.choices?.[0]?.message ?? { role: "assistant", content: "No response" };
    const out = NextResponse.json({ assistant });
    if (setCookie) out.headers.set("Set-Cookie", setCookie);
    return out;
  } catch (err: unknown) {
    return NextResponse.json({ error: errToString(err) }, { status: 500 });
  }
}
