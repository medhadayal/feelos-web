export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { rateLimit } from "../../../../lib/rateLimit";
import { getOrCreateSessionUserId } from "../../../../lib/session";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };
type Attachment =
  | { type: "text"; name: string; text: string }
  | { type: "image"; name: string; dataUrl: string };

type ChatRequest = {
  userId?: string;
  messages: ChatMessage[];
  moodSnapshot?: { mood?: string };
  attachments?: Attachment[];
};

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
  return out;
}

function capText(s: string, max = 2500) {
  if (s.length <= max) return s;
  return s.slice(0, max) + "…";
}

function buildSystemPrompt(mood?: string) {
  const moodLine = mood ? `User mood (self-reported): ${mood}.` : "";
  const productContext = [
    "Product context (FeelOS):",
    "- FeelOS is an AI coaching platform (Phase 1) and later aims to become an AI operating system (Phase 2).",
    "- Key Phase 1 features in this app:",
    "  - AI Companion: chat-based coach; can support career, wellbeing, work-life balance, and general productivity.",
    "  - Career Coach tools: Resume Optimizer, LinkedIn Optimizer, Cover Letter Generator.",
    "  - Tracker: job applications tracking (add/list).",
    "- When asked about FeelOS or its coaches, explain these capabilities plainly and accurately.",
    "- If the user asks for a feature that isn't implemented (e.g., real video calling with the AI), say it's not available yet and suggest what they can do now.",
  ].join("\n");

  return [
    "You are FeelOS AI Companion.",
    "You are a coaching-first assistant: practical, calm, and encouraging.",
    "You can help with: physical health & wellbeing (general info), mental health support (non-clinical), work-life balance, career growth, productivity, and planning.",
    "Tone: friendly and supportive, but honest. If you are unsure, say so.",
    "Default to concise answers (5-10 sentences). If the user asks for a lot, summarize first and ask if they want details.",
    "Ask 1-2 clarifying questions when needed.",
    "If asked for real-time information (e.g., live stock prices), you may provide the latest available value only if you have a source; otherwise say you don't have live data. Never invent numbers.",
    "Health safety: You are not a doctor. Do not diagnose. For emergencies or severe symptoms, advise contacting local emergency services or a qualified professional.",
    "If the user uploads text or images, use them as context and reference what you see/what was provided.",
    productContext,
    moodLine,
  ]
    .filter(Boolean)
    .join("\n");
}

function isTextAttachment(a: Attachment): a is Extract<Attachment, { type: "text" }> {
  return a.type === "text";
}

function isImageAttachment(a: Attachment): a is Extract<Attachment, { type: "image" }> {
  return a.type === "image";
}

async function fetchMsftQuote() {
  // stooq provides free delayed quotes (no API key). Not guaranteed real-time.
  const url = "https://stooq.com/q/l/?s=msft.us&f=sd2t2ohlcv&h&e=csv";
  const r = await fetch(url, { method: "GET" });
  if (!r.ok) throw new Error("quote_unavailable");
  const csv = await r.text();
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error("quote_unavailable");
  const header = lines[0].split(",");
  const row = lines[1].split(",");
  const idx = (name: string) => header.findIndex((h) => h.trim().toLowerCase() === name);
  const symbol = row[idx("symbol")] ?? "MSFT.US";
  const date = row[idx("date")] ?? "";
  const time = row[idx("time")] ?? "";
  const close = row[idx("close")] ?? "";
  return { symbol, date, time, close };
}

function looksLikeMsftPriceQuestion(text: string) {
  const t = text.toLowerCase();
  const hasPrice = t.includes("stock") && (t.includes("price") || t.includes("quote") || t.includes("trading"));
  const hasMsft = t.includes("microsoft") || /\bmsft\b/.test(t);
  const hasNow = t.includes("today") || t.includes("now") || t.includes("current");
  return hasPrice && hasMsft && hasNow;
}

async function getRecentHistory(userId: string) {
  try {
    if (!process.env.DATABASE_URL) return [] as ChatMessage[];
    const rows = await prisma.conversationMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 24,
    });
    return rows
      .slice()
      .reverse()
      .map((r) => ({ role: (r.role as ChatMessage["role"]) ?? "user", content: String(r.content ?? "") }))
      .filter((m) => (m.role === "user" || m.role === "assistant") && m.content.trim());
  } catch {
    return [] as ChatMessage[];
  }
}

function mergeContext(dbHistory: ChatMessage[], incoming: ChatMessage[]) {
  const merged = [...dbHistory, ...incoming]
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ ...m, content: capText(m.content, 2500) }));

  // Deduplicate exact consecutive repeats (helps when clients resend full history).
  const deduped: ChatMessage[] = [];
  for (const m of merged) {
    const prev = deduped[deduped.length - 1];
    if (prev && prev.role === m.role && prev.content === m.content) continue;
    deduped.push(m);
  }

  // Keep last N messages.
  return deduped.slice(-30);
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
    const rl = rateLimit(req, { key: "api:companion-chat", limit: 20, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetMs - Date.now()) / 1000)) } }
      );
    }

    const raw: ChatRequest = await req.json();
    const messages = normalizeMessages(raw?.messages);
    if (!messages) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { userId, setCookie } = getOrCreateSessionUserId(req);

    const mood = raw?.moodSnapshot?.mood;

    // Persist only the newest user message (best-effort) to avoid duplicates.
    const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    if (lastUser) await persistMessage(userId, "user", lastUser);

    // Limited real-world data helper: MSFT price via stooq.
    if (lastUser && looksLikeMsftPriceQuestion(lastUser)) {
      try {
        const q = await fetchMsftQuote();
        const reply = `Latest available Microsoft (${q.symbol}) close from stooq: $${q.close} on ${q.date} ${q.time}.\n\nNote: This source may be delayed and is not guaranteed real-time. If you need the live price, check your broker or a real-time market data site.`;
        await persistMessage(userId, "assistant", reply);
        const out = NextResponse.json({ reply, suggestedActions: [] });
        if (setCookie) out.headers.set("Set-Cookie", setCookie);
        return out;
      } catch {
        // fall through to model
      }
    }

    // Build context with DB history (memory) + incoming messages.
    const dbHistory = await getRecentHistory(userId);
    const context = mergeContext(dbHistory, messages);

    const attachments = Array.isArray(raw?.attachments) ? (raw.attachments as Attachment[]) : [];
    const textAttachments = attachments.filter(isTextAttachment);
    const imageAttachments = attachments.filter(isImageAttachment);

    const systemPrompt = buildSystemPrompt(mood);

    // If there are text attachments, append them to the last user turn.
    let augmentedContext: ChatMessage[] = context;
    if (textAttachments.length) {
      const appended = textAttachments
        .map((a) => `\n\n[Attached file: ${a.name}]\n${capText(String(a.text ?? ""), 12_000)}`)
        .join("");

      const idx = augmentedContext
        .map((m) => m.role)
        .lastIndexOf("user");
      if (idx >= 0) {
        const copy = [...augmentedContext];
        copy[idx] = { ...copy[idx], content: capText(copy[idx].content + appended, 14_000) };
        augmentedContext = copy;
      }
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      const reply = localAssistantReply(lastUser, mood ?? "neutral");
      await persistMessage(userId, "assistant", reply);
      const out = NextResponse.json({ reply, suggestedActions: [] });
      if (setCookie) out.headers.set("Set-Cookie", setCookie);
      return out;
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    // Build OpenAI messages, optionally attaching images to the most recent user message.
    const openAiMessages: Array<{ role: string; content: unknown }> = [{ role: "system", content: systemPrompt }];
    for (let i = 0; i < augmentedContext.length; i++) {
      const m = augmentedContext[i];
      if (m.role !== "user" && m.role !== "assistant") continue;

      const isLastUser = m.role === "user" && i === augmentedContext.length - 1;
      if (isLastUser && imageAttachments.length) {
        openAiMessages.push({
          role: "user",
          content: [
            { type: "text", text: m.content },
            ...imageAttachments.map((a) => ({
              type: "image_url",
              image_url: { url: a.dataUrl },
            })),
          ],
        });
      } else {
        openAiMessages.push({ role: m.role, content: m.content });
      }
    }

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: openAiMessages,
        temperature: 0.4,
        max_tokens: 1100,
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => "openai error");
      const fallback = localAssistantReply(lastUser, mood ?? "neutral");
      await persistMessage(userId, "assistant", fallback);
      const out = NextResponse.json({
        reply: fallback,
        suggestedActions: [],
        error: "openai_error",
        details: capText(txt, 800),
      });
      if (setCookie) out.headers.set("Set-Cookie", setCookie);
      return out;
    }

    const data = await resp.json();
    const reply: string = String(data?.choices?.[0]?.message?.content ?? "").trim() || "(No reply)";
    await persistMessage(userId, "assistant", reply);
    const out = NextResponse.json({ reply, suggestedActions: [] });
    if (setCookie) out.headers.set("Set-Cookie", setCookie);
    return out;
  } catch (err: unknown) {
    return NextResponse.json({ error: errToString(err) }, { status: 500 });
  }
}
