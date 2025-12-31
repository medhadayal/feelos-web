import { NextResponse } from "next/server";
import { rateLimit } from "../../../lib/rateLimit";
import { getOrCreateSessionUserId } from "../../../lib/session";

export const runtime = "nodejs";

type ReqBody = {
  messages: { role: string; content: string }[];
  max_tokens?: number;
  temperature?: number;
};

function errToString(err: unknown) {
  if (err instanceof Error) return err.message;
  return String(err);
}

function chunkString(str: string, size = 60) {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += size) chunks.push(str.slice(i, i + size));
  return chunks;
}

export async function POST(req: Request) {
  try {
    const rl = rateLimit(req, { key: "api:chat-stream", limit: 10, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetMs - Date.now()) / 1000)) } }
      );
    }

    const { setCookie } = getOrCreateSessionUserId(req);

    const body: ReqBody = await req.json();
    if (!body?.messages || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    // Call OpenAI (non-streaming) and stream chunks to client via SSE.
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: body.messages,
        max_tokens: body.max_tokens ?? 800,
        temperature: body.temperature ?? 0.8,
        n: 1,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ error: "OpenAI error", details: text }, { status: resp.status });
    }

    const data = await resp.json();
    const assistant = data?.choices?.[0]?.message?.content ?? "";

    // Build SSE stream emitting chunks
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const chunks = chunkString(assistant, 60);
        for (const c of chunks) {
          const sse = `data: ${JSON.stringify({ chunk: c })}\n\n`;
          controller.enqueue(encoder.encode(sse));
        }
        // final 'done' event
        controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
        controller.close();
      },
    });

    const res = new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
    if (setCookie) res.headers.set("Set-Cookie", setCookie);
    return res;
  } catch (err: unknown) {
    return NextResponse.json({ error: errToString(err) }, { status: 500 });
  }
}
