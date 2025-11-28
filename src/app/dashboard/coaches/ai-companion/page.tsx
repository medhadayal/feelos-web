'use client';

import React, { useEffect, useRef, useState } from "react";

/**
 * Local-only AI Companion (no OpenAI / no server calls)
 * - Polished FAANG-like UI
 * - Local reply generator (heuristics + canned responses)
 * - Simulated streaming (chunking) for progressive rendering
 * - Optional TTS (Web Speech) — client-side only
 */

/* ----- Types & helpers ----- */
type Role = "user" | "assistant" | "system";
type Message = { id: string; role: Role; text: string; time: string };

const uid = (p = "") => p + Math.random().toString(36).slice(2, 9);
const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/* Small local "AI" engine — deterministic, safe, offline */
function localAssistantReply(userText: string, mood: string) {
  // Simple heuristics + canned suggestions
  const lower = userText.toLowerCase();
  if (!userText.trim()) return "Hi — tell me what's on your mind and I'll help you break it down.";

  if (lower.includes("resume") || lower.includes("cv")) {
    return `I can help with your resume. Share a key bullet or role and I'll suggest improvements (quantify impact, add keywords, shorten where possible).`;
  }
  if (lower.includes("interview") || lower.includes("practice")) {
    return `Let's do a quick mock interview: tell me the role and I'll ask a common question. We'll iterate on your answers.`;
  }
  if (lower.includes("anxious") || lower.includes("anxiety") || mood === "concerned") {
    return `I hear you're feeling anxious. Try a 2‑minute grounding exercise: 4s breath in, hold 4s, 6s out. Want me to guide you through it?`;
  }
  // fallback constructive reply
  const suggestions = [
    "Break tasks into 15‑minute blocks and focus on one at a time.",
    "Try a short breathing exercise to reset your mind.",
    "Write down a single next action and do that one thing now."
  ];
  return `Thanks — here's a quick plan:\n\n1) ${suggestions[0]}\n2) ${suggestions[1]}\n3) ${suggestions[2]}\n\nWhich step would you like to try?`;
}

/* chunk text into pieces for simulated streaming */
function chunkText(text: string, size = 40) {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size));
  return out;
}

/* ----- Main component (local-only) ----- */
export default function AICompanionLocal() {
  const [messages, setMessages] = useState<Message[]>(
    [
      { id: uid("m_"), role: "assistant", text: "Hello — I'm your FeelOS Companion (local mode). How can I help today?", time: now() },
    ]
  );
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [mood, setMood] = useState<"happy" | "neutral" | "concerned">("neutral");
  const [focus, setFocus] = useState(["Plan routine", "Deep work", "Inbox triage"]);
  const [selfCare, setSelfCare] = useState("5‑minute breathing");
  const chatRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  /* Keyboard: Ctrl/Cmd+Enter to send */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        send();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [input, messages]);

  function pushMessage(role: Role, text: string) {
    const msg = { id: uid("m_"), role, text, time: now() };
    setMessages((s) => [...s, msg]);
    return msg;
  }

  async function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    // append user message immediately
    setMessages((m) => [...m, { id: uid("m_"), role: "user", text, time: now() }]);

    setLoading(true);
    setIsTyping(true);
    try {
      const res = await fetch("/api/companion/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user_1",
          messages: [...messages, { id: "tmp", role: "user", text, time: now() }].map(x => ({ role: x.role as any, content: x.text })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Network" }));
        setMessages((m) => [...m, { id: uid("m_"), role: "assistant", text: `[Error] ${err?.error || "Unable to get reply"}`, time: now() }]);
        return;
      }

      const json = await res.json();
      const replyText: string = json?.reply ?? "Sorry — no reply.";

      // progressive client-side streaming (chunk the reply)
      const chunks: string[] = [];
      const size = 36;
      for (let i = 0; i < replyText.length; i += size) chunks.push(replyText.slice(i, i + size));

      const assistId = uid("m_");
      setMessages((m) => [...m, { id: assistId, role: "assistant", text: "", time: now() }]);
      for (const chunk of chunks) {
        setMessages((prev) => {
          const copy = [...prev];
          const idx = copy.findIndex(x => x.id === assistId);
          if (idx >= 0) copy[idx] = { ...copy[idx], text: copy[idx].text + chunk, time: now() };
          else copy.push({ id: assistId, role: "assistant", text: chunk, time: now() });
          return copy;
        });
        if (ttsEnabled && chunk.trim() && 'speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance(chunk);
          u.lang = "en-US";
          window.speechSynthesis.speak(u);
        }
        await new Promise(r => setTimeout(r, 100));
      }

    } catch (err: any) {
      setMessages((m) => [...m, { id: uid("m_"), role: "assistant", text: `[Error] ${String(err?.message ?? err)}`, time: now() }]);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  }

  function quickAction(text: string) {
    setInput(text);
    setTimeout(() => send(), 80);
  }

  function logMood(newMood: "happy" | "neutral" | "concerned") {
    setMood(newMood);
    // local-only: no network call
    pushMessage("system", `Mood logged: ${newMood}`);
  }

  return (
    <div className="min-h-screen w-full bg-[linear-gradient(180deg,#050816,#0b1221,#020617)] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Avatar / Intro */}
        <aside className="lg:col-span-4 flex flex-col items-center lg:items-start gap-6">
          <div className="flex flex-col items-center lg:items-start gap-4">
            <div className="rounded-full p-1 bg-gradient-to-br from-white/6 to-white/3 shadow-2xl hover:scale-105 transition-transform">
              {/* Cartoon character avatar (inline SVG) */}
              <svg viewBox="0 0 160 160" className="w-36 h-36 rounded-full" role="img" aria-label="FeelOS cartoon avatar">
                <defs>
                  <linearGradient id="gradA" x1="0" x2="1">
                    <stop offset="0%" stopColor="#FF8AA2" />
                    <stop offset="100%" stopColor="#FFD76B" />
                  </linearGradient>
                </defs>
                <circle cx="80" cy="80" r="76" fill="url(#gradA)" />
                {/* friendly face */}
                <ellipse cx="56" cy="72" rx="8" ry="10" fill="#fff" />
                <ellipse cx="104" cy="72" rx="8" ry="10" fill="#fff" />
                <circle cx="56" cy="74" r="3.5" fill="#0b1220" />
                <circle cx="104" cy="74" r="3.5" fill="#0b1220" />
                <path d="M56 98 C72 114, 88 114, 104 98" stroke="#0b1220" strokeWidth="4" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-semibold">FeelOS Companion (Local)</h2>
              <p className="text-sm text-slate-300 mt-1 max-w-[20rem]">Offline companion for guidance, micro-actions and quick planning — no external AI required.</p>
            </div>
          </div>

          <div className="w-full space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-300">Mood</div>
              <div className="text-xs text-slate-300">{mood}</div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => logMood("happy")} className="px-3 py-1 rounded-full bg-amber-300 text-slate-900 text-sm">Happy</button>
              <button onClick={() => logMood("neutral")} className="px-3 py-1 rounded-full bg-white/6 text-sm">Neutral</button>
              <button onClick={() => logMood("concerned")} className="px-3 py-1 rounded-full bg-rose-600 text-white text-sm">Concerned</button>
            </div>

            <div className="mt-2 bg-white/5 border border-white/6 p-3 rounded">
              <div className="text-xs text-slate-400">Today focus</div>
              <ol className="list-decimal ml-5 mt-2 text-sm">
                {focus.map((f, i) => <li key={i}>{f}</li>)}
              </ol>
              <div className="mt-2 text-sm">Self-care: <strong>{selfCare}</strong></div>
            </div>
          </div>
        </aside>

        {/* Chat area */}
        <main className="lg:col-span-8 flex flex-col">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl p-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs text-slate-300">FeelOS (Local)</div>
                <div className="text-lg font-semibold">Chat & micro-actions</div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs text-slate-300 flex items-center gap-2">
                  <input type="checkbox" checked={ttsEnabled} onChange={(e) => setTtsEnabled(e.target.checked)} className="accent-pink-400" />
                  <span>Speech</span>
                </label>
              </div>
            </div>

            {/* quick action chips */}
            <div className="mb-3 flex flex-wrap gap-3">
              <QuickChip label="I feel anxious" onClick={() => quickAction("I feel anxious")} />
              <QuickChip label="Draft message" onClick={() => quickAction("Draft a short message")} />
              <QuickChip label="Plan my day" onClick={() => quickAction("Help me plan my day")} />
            </div>

            {/* chat log */}
            <div ref={chatRef} className="flex-1 overflow-auto space-y-4 p-2" role="log" aria-live="polite">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} px-2`}>
                  <div className={`max-w-[80%] rounded-lg p-3 ${m.role === "user" ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white" : "bg-black/40 border border-white/6 text-slate-100"}`}>
                    <div className="whitespace-pre-wrap text-sm">{m.text || <MessageSkeleton />}</div>
                    <div className="text-xs text-slate-400 mt-2 text-right">{m.time}</div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start px-2">
                  <div className="bg-black/40 rounded-lg p-3">
                    <TypingDots />
                  </div>
                </div>
              )}
            </div>

            {/* input bar */}
            <div className="mt-4 pt-4 border-t border-white/6">
              <div className="flex items-end gap-3">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask FeelOS anything..."
                  rows={3}
                  className="flex-1 rounded-md bg-black/20 px-4 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                  }}
                />
                <button onClick={send} disabled={!input.trim()} className={`px-4 py-3 rounded-lg font-semibold ${input.trim() ? "bg-gradient-to-r from-pink-500 to-yellow-300 text-slate-900" : "bg-white/6 text-slate-400 cursor-not-allowed"}`}>
                  Send
                </button>
              </div>
              <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                <div>Tip: Press Enter to send. Ctrl/Cmd+Enter also works.</div>
                <div className="text-amber-300">Local mode — offline replies</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ----- UI helpers ----- */

function QuickChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-3 py-2 rounded-lg bg-white/6 text-sm transition-all duration-200 hover:shadow-2xl hover:-translate-y-0.5">
      {label}
    </button>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      <span className="w-2.5 h-2.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-2.5 h-2.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "120ms" }} />
      <span className="w-2.5 h-2.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "240ms" }} />
    </div>
  );
}

function MessageSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-3 w-3/4 rounded bg-white/8 animate-pulse" />
      <div className="h-3 w-1/2 rounded bg-white/8 animate-pulse" />
    </div>
  );
}

function QuickActionPlaceholder() {
  return null;
}
