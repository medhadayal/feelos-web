// Server-side OpenAI helper (nodejs runtime). Keep secrets server-side only.
export async function openaiChatStream({ messages, model, temperature = 0.2 }: { messages: { role: string; content: string }[]; model?: string; temperature?: number }) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not configured");

  const resolvedModel = model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: resolvedModel,
      messages,
      temperature,
      stream: false // set true if you want raw streaming; here we call non-streaming and stream slices to client
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI error: ${t}`);
  }

  const json = await res.json();
  const assistant = json?.choices?.[0]?.message?.content ?? "";
  return assistant;
}
