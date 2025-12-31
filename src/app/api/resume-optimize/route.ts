import { NextResponse } from "next/server";
import { rateLimit } from "../../../lib/rateLimit";
import { getOrCreateSessionUserId } from "../../../lib/session";

export const runtime = "nodejs";

type ReqBody = {
  resumeText: string;
  jobDesc: string;
  targetRole: string;
  location?: string;
};

function errToString(err: unknown) {
  if (err instanceof Error) return err.message;
  return String(err);
}

function extractJsonFromString(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    const m = s.match(/\{[\s\S]*\}$/);
    if (m) {
      try { return JSON.parse(m[0]); } catch { return null; }
    }
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const rl = rateLimit(req, { key: "api:resume-optimize", limit: 6, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetMs - Date.now()) / 1000)) } }
      );
    }

    const { setCookie } = getOrCreateSessionUserId(req);

    const body: ReqBody = await req.json();
    if (!body.resumeText || !body.jobDesc || !body.targetRole) {
      return NextResponse.json({ error: "resumeText, jobDesc and targetRole are required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured on server" }, { status: 500 });
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const systemPrompt = `
You are an expert resume optimizer and ATS specialist. Given a candidate resume, job description, and target role, return ONLY a single valid JSON object (no surrounding text) with these keys:
{
  "ats_score": number,            // 0-100
  "jd_match_score": number,       // 0-100
  "section_improvements": {       // section name -> array of suggestions
    "Summary": ["...","..."],
    "Experience": ["..."]
  },
  "optimized_resume": string      // full optimized resume text; preserve timeline & facts; do NOT invent numeric facts; improve bullets and include job keywords
}
If you cannot produce a numeric value, use null. Output must be valid JSON only.
`;

    const userPrompt = `
Resume:
${body.resumeText}

Job description:
${body.jobDesc}

Target role/title: ${body.targetRole}
Location preference: ${body.location || "None"}

Respond only with the JSON described above.
`;

    const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 2500,
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
      return NextResponse.json({ error: "Failed to parse assistant JSON", raw: assistant }, { status: 502 });
    }

    // basic validation
    const result = {
      ats_score: typeof parsed.ats_score === "number" ? parsed.ats_score : null,
      jd_match_score: typeof parsed.jd_match_score === "number" ? parsed.jd_match_score : null,
      section_improvements: parsed.section_improvements ?? {},
      optimized_resume: parsed.optimized_resume ?? "",
    };

    const out = NextResponse.json({ result });
    if (setCookie) out.headers.set("Set-Cookie", setCookie);
    return out;
  } catch (err: unknown) {
    return NextResponse.json({ error: errToString(err) }, { status: 500 });
  }
}
