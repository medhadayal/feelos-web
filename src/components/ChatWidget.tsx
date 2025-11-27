'use client';

import React, { useState, useRef, useEffect } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatWidget() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    if (!input.trim()) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });
      const json = await res.json();
      if (json.assistant) {
        const assistant = json.assistant;
        const content = assistant.content ?? "";
        setMessages((m) => [...m, { role: "assistant", content }]);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: `Error: ${json.error || "No response"}` }]);
      }
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "Network error — try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="card p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">AI Companion</h4>
          <span className="text-xs text-muted">{loading ? "Thinking…" : "Ready"}</span>
        </div>

        <div ref={listRef} className="h-48 overflow-auto rounded p-3 bg-black/20 text-sm space-y-3">
          {messages.length === 0 ? (
            <div className="text-sm text-slate-400">Ask the AI Companion for career or wellbeing advice, reminders, or quick tips.</div>
          ) : null}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`${m.role === "user" ? "bg-white/6" : "bg-white/10"} inline-block px-3 py-1 rounded-md max-w-[80%]`}>
                {m.content}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            className="flex-1 rounded-md bg-black/20 px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--ring)]"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            placeholder="Ask the AI Companion..."
            aria-label="Chat input"
            disabled={loading}
          />
          <button
            onClick={send}
            disabled={loading}
            className="rounded-md bg-gradient-to-r from-pink-500 to-yellow-300 px-4 text-sm font-semibold"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
