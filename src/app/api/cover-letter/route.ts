import { NextResponse } from "next/server";
import { rateLimit } from "../../../lib/rateLimit";
import { getOrCreateSessionUserId } from "../../../lib/session";

export const runtime = "nodejs";

type ReqBody = {
  resumeText: string;
  jobDesc: string;
  jobTitle: string;
  company?: string;
};

function errToString(err: unknown) {
  if (err instanceof Error) return err.message;
  return String(err);
}

export async function POST(req: Request) {
  try {
    const rl = rateLimit(req, { key: "api:cover-letter", limit: 8, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetMs - Date.now()) / 1000)) } }
      );
    }

    const { setCookie } = getOrCreateSessionUserId(req);

    const body = (await req.json()) as ReqBody;
    if (!body.resumeText?.trim() || !body.jobDesc?.trim() || !body.jobTitle?.trim()) {
      return NextResponse.json({ error: "resumeText, jobDesc and jobTitle are required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured on server" }, { status: 500 });
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const systemPrompt = `
You are an expert cover letter writer.
Given a candidate resume and a job description, write a concise, high-quality cover letter tailored to the job.
Output ONLY plain text (no markdown), suitable to paste into an application.
Rules:
- Do NOT invent facts, metrics, employers, degrees, dates.
- Use the candidate's existing experience; if a detail is missing, keep it generic.
- Keep it 250-400 words.
- Use a professional tone. Avoid overly flowery language.
`;

    const userPrompt = `
Job title: ${body.jobTitle}
Company (optional): ${body.company || ""}

Resume:
${body.resumeText}

Job description:
${body.jobDesc}

Write the cover letter now.
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
        temperature: 0.4,
        max_tokens: 900,
      }),
    });

    if (!openAiRes.ok) {
      const text = await openAiRes.text();
      let userMessage = "Failed to generate cover letter";
      try {
        const errorData = JSON.parse(text);
        if (errorData?.error?.message?.includes("invalid_request_error")) userMessage = "Invalid request to AI service. Please check your inputs.";
        if (errorData?.error?.message?.includes("rate_limit")) userMessage = "Too many requests. Please wait a moment and try again.";
        if (errorData?.error?.message?.includes("server_error")) userMessage = "AI service temporarily unavailable. Please try again in a moment.";
        if (openAiRes.status === 401) userMessage = "AI service authentication failed (server configuration issue).";
      } catch {}
      return NextResponse.json({ error: userMessage, details: text }, { status: openAiRes.status });
    }

    const data = await openAiRes.json();
    const letter = (data?.choices?.[0]?.message?.content ?? "").trim();
    if (!letter) {
      return NextResponse.json({ error: "No cover letter generated" }, { status: 502 });
    }

    const out = NextResponse.json({ result: { cover_letter: letter } });
    if (setCookie) out.headers.set("Set-Cookie", setCookie);
    return out;
  } catch (err: unknown) {
    return NextResponse.json({ error: errToString(err) }, { status: 500 });
  }
}
