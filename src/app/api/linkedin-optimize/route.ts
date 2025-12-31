import { NextResponse } from "next/server";
import { rateLimit } from "../../../lib/rateLimit";
import { getOrCreateSessionUserId } from "../../../lib/session";

export const runtime = "nodejs";

type ReqBody = {
  profileText: string;
  targetRole?: string;
  jobDesc?: string;
};

function errToString(err: unknown) {
  if (err instanceof Error) return err.message;
  return String(err);
}

function extractJsonFromString(s: string) {
  const cleaned = s
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to locate the first valid JSON object in the text (handles extra prose).
    const text = cleaned;
    let inString = false;
    let escape = false;
    let depth = 0;
    let start = -1;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        if (inString) escape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;

      if (ch === "{") {
        if (depth === 0) start = i;
        depth++;
      } else if (ch === "}") {
        if (depth > 0) depth--;
        if (depth === 0 && start >= 0) {
          const candidate = text.slice(start, i + 1);
          try {
            return JSON.parse(candidate);
          } catch {
            start = -1;
          }
        }
      }
    }
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const rl = rateLimit(req, { key: "api:linkedin-optimize", limit: 8, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetMs - Date.now()) / 1000)) } }
      );
    }

    const { setCookie } = getOrCreateSessionUserId(req);

    const body = (await req.json()) as ReqBody;
    if (!body.profileText?.trim()) {
      return NextResponse.json({ error: "profileText is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured on server" }, { status: 500 });
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const systemPrompt = `
You are an expert LinkedIn profile writer and recruiter.
Given a candidate's current LinkedIn/profile text plus an optional target role and job description, produce ATS + recruiter-friendly LinkedIn copy.
Return ONLY a single valid JSON object (no surrounding text) with keys:
{
  "headline": string,              // <= 220 chars, punchy
  "about": string,                 // 3-6 short paragraphs, skimmable
  "top_keywords": string[],        // 10-20 role-relevant keywords
  "experience_bullets": string[],  // 6-10 impact bullets (no invented facts)
  "suggestions": string[]          // 6-10 concrete improvement actions
}
Rules:
- Do NOT invent employers, dates, degrees, metrics. If missing, keep generic.
- Use strong action verbs and clarity; keep it professional.
- Optimize for the given target role/JD if provided.
`;

    const userPrompt = `
Current profile text:
${body.profileText}

Target role/title (optional): ${body.targetRole || ""}

Job description (optional):
${body.jobDesc || ""}

Return only JSON.
`;

    const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1800,
      }),
    });

    if (!openAiRes.ok) {
      const text = await openAiRes.text();
      return NextResponse.json({ error: "OpenAI error", details: text }, { status: openAiRes.status });
    }

    const data = await openAiRes.json();
    const assistant = data?.choices?.[0]?.message?.content ?? "";
    const parsed = extractJsonFromString(assistant);

    if (!parsed) {
      // Best-effort fallback: return the raw assistant output so the user still gets something usable.
      const firstLine = assistant.split(/\r?\n/).map((x: string) => x.trim()).find((x: string) => x.length) ?? "";
      return NextResponse.json({
        result: {
          headline: firstLine.slice(0, 220),
          about: assistant,
          top_keywords: [],
          experience_bullets: [],
          suggestions: ["AI response was not valid JSON; try Optimize again for structured output."],
        },
        meta: { parsed: false },
      });
    }

    const result = {
      headline: typeof parsed.headline === "string" ? parsed.headline : "",
      about: typeof parsed.about === "string" ? parsed.about : "",
      top_keywords: Array.isArray(parsed.top_keywords) ? parsed.top_keywords.map(String) : [],
      experience_bullets: Array.isArray(parsed.experience_bullets) ? parsed.experience_bullets.map(String) : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.map(String) : [],
    };

    const out = NextResponse.json({ result, meta: { parsed: true } });
    if (setCookie) out.headers.set("Set-Cookie", setCookie);
    return out;
  } catch (err: unknown) {
    return NextResponse.json({ error: errToString(err) }, { status: 500 });
  }
}
