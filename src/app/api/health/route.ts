export const runtime = "nodejs";

import { NextResponse } from "next/server";

function asBool(v: string | undefined): boolean {
  return typeof v === "string" && v.length > 0;
}

export async function GET() {
  const hasOpenAIKey = asBool(process.env.OPENAI_API_KEY);
  const hasModelUrl = asBool(process.env.MODEL_INFERENCE_URL);
  const model = process.env.OPENAI_MODEL ?? null;
  const hasDatabase = asBool(process.env.DATABASE_URL);

  const ok = hasOpenAIKey || hasModelUrl;

  return NextResponse.json(
    {
      ok,
      product: "feelos-web",
      env: {
        openaiConfigured: hasOpenAIKey,
        modelInferenceUrlConfigured: hasModelUrl,
        openaiModel: model,
        databaseConfigured: hasDatabase,
        nodeEnv: process.env.NODE_ENV ?? null,
      },
      now: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 }
  );
}
