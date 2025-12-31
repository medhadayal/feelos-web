'use client';
// Replace mock client with streaming consumption of /api/companion/chat (SSE-like)
import React, { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function AIAvatarChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight }), [messages]);

  async function send() {
    if (!input.trim()) return;
    const user = { role: "user" as const, content: input.trim() };
    setMessages((s) => [...s, user]);
    setInput("");
    setSending(true);

    // POST to server - server streams back SSE-like data
    const res = await fetch("/api/companion/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "user_1", messages: [...messages, user].map(m => ({ role: m.role, content: m.content })) }),
    });

    if (!res.ok || !res.body) {
      const err = await res.json().catch(() => ({ error: "Network" }));
      setMessages((s) => [...s, { role: "assistant", content: `[Error] ${err?.error || "unknown"}` }]);
      setSending(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let assistantIndex = -1;
    // create blank assistant message
    setMessages((s) => { assistantIndex = s.length; return [...s, { role: "assistant", content: "" }]; });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // parse SSE chunks like "data: {...}\n\n"
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";
      for (const part of parts) {
        const line = part.trim();
        if (!line) continue;
        if (line.startsWith("data:")) {
          const payload = line.replace(/^data:\s*/, "");
          try {
            const obj = JSON.parse(payload);
            const chunk = obj.chunk ?? "";
            setMessages((prev) => {
              const copy = [...prev];
              if (assistantIndex >= 0 && assistantIndex < copy.length) {
                copy[assistantIndex] = { ...copy[assistantIndex], content: copy[assistantIndex].content + chunk };
              } else {
                copy.push({ role: "assistant", content: chunk });
                assistantIndex = copy.length - 1;
              }
              return copy;
            });
          } catch {
            // ignore parse errors
          }
        } else if (line.startsWith("event: done")) {
          // end event
        }
      }
    }

    setSending(false);
  }

  return (
    <div className="space-y-3">
      <div ref={chatRef} className="h-72 overflow-auto bg-black/20 p-3 rounded-lg space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={`p-2 rounded ${m.role === "user" ? "bg-linear-to-r from-purple-600 to-pink-500 text-white ml-auto max-w-[80%]" : "bg-white/5 text-slate-100 max-w-[80%]"}`}>
            <div className="whitespace-pre-wrap">{m.content || "..."}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <textarea value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 rounded p-2 bg-black/10" rows={2} />
        <button onClick={send} disabled={sending || !input.trim()} className="px-4 py-2 rounded bg-linear-to-r from-pink-500 to-yellow-300 text-slate-900">
          {sending ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  );
}
