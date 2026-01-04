'use client';

import React, { useEffect, useRef, useState } from "react";

type Role = "user" | "assistant";
type Message = { id: string; role: Role; content: string; timestamp: string };

const mockUser = { id: "user_1", name: "You" };

export default function CompanionPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "m1", role: "assistant", content: "Hi — I\u2019m your FeelOS Companion. How can I help today?", timestamp: new Date().toISOString() },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [mood, setMood] = useState<string>("neutral");
  const todayFocus: string[] = ["Plan morning routine", "Deep work: product spec", "1:1 with manager"];
  const [selfCare, setSelfCare] = useState<string>("Take a 10‑minute mindful walk");
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [attachment, setAttachment] = useState<{ kind: "text"; name: string; text: string } | { kind: "image"; name: string; dataUrl: string } | null>(null);

  const speechRef = useRef<any>(null);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    const w = window as any;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;
    const r = new Ctor();
    r.continuous = false;
    r.interimResults = false;
    r.lang = "en-US";
    speechRef.current = r;
    return () => {
      try { r.stop(); } catch {}
      speechRef.current = null;
    };
  }, []);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function addMessage(role: Role, content: string) {
    const msg: Message = { id: Math.random().toString(36).slice(2), role, content, timestamp: new Date().toISOString() };
    setMessages((m) => [...m, msg]);
    return msg;
  }

  async function sendMessage(userText?: string) {
    const text = (userText ?? input).trim();
    if (!text && !attachment) return;
    setInput("");
    setSending(true);
    const userVisible = text || (attachment ? `[Attached: ${attachment.name}]` : "");
    addMessage("user", userVisible);

    // POST to API (mock). The API returns { reply, suggestedActions }.
    try {
      const res = await fetch("/api/companion/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: mockUser.id,
          messages: messages
            .concat({ id: "tmp", role: "user", content: userVisible, timestamp: new Date().toISOString() })
            .map(m => ({ role: m.role, content: m.content })),
          moodSnapshot: { mood },
          attachments: attachment
            ? [
                attachment.kind === "image"
                  ? { type: "image" as const, name: attachment.name, dataUrl: attachment.dataUrl }
                  : { type: "text" as const, name: attachment.name, text: attachment.text },
              ]
            : [],
        }),
      });
      const json = await res.json();
      const reply: string = json?.reply ?? "Sorry, I couldn't form a reply.";

      // Simulate streaming by chunking reply client-side
      const chunkSize = 40;
      let idx = 0;
      const assistantId = Math.random().toString(36).slice(2);
      addMessage("assistant", ""); // placeholder assistant message
      function streamStep() {
        const next = reply.slice(idx, idx + chunkSize);
        idx += chunkSize;
        setMessages((m) => {
          // replace last assistant placeholder with appended content
          const copy = [...m];
          const lastIndex = copy.map(x => x.role).lastIndexOf("assistant");
          if (lastIndex >= 0) {
            const last = copy[lastIndex];
            copy[lastIndex] = { ...last, content: last.content + next, timestamp: new Date().toISOString() };
          } else {
            copy.push({ id: assistantId, role: "assistant", content: next, timestamp: new Date().toISOString() });
          }
          return copy;
        });
        // speak chunk (optional) using Web Speech API
        if ("speechSynthesis" in window && next.trim()) {
          const u = new SpeechSynthesisUtterance(next);
          u.lang = "en-US";
          u.rate = 1;
          window.speechSynthesis.speak(u);
        }
        if (idx < reply.length) {
          setTimeout(streamStep, 120);
        } else {
          setSending(false);
          setAttachment(null);
          // suggested actions could be displayed; for now mock update
          if (json?.suggestedActions?.length) {
            // optionally show quick suggestions (not implemented visually here)
            console.log("suggestedActions:", json.suggestedActions);
          }
        }
      }
      setTimeout(streamStep, 120);
    } catch {
      addMessage("assistant", "Network error — please try again.");
      setSending(false);
    }
  }

  async function onFileSelected(file: File | null) {
    if (!file) return;
    if (file.size > 4.5 * 1024 * 1024) {
      addMessage("assistant", "File too large (max ~4.5MB). Please upload a smaller file.");
      return;
    }

    const lname = file.name.toLowerCase();
    const isImage = file.type.startsWith("image/") || lname.endsWith(".png") || lname.endsWith(".jpg") || lname.endsWith(".jpeg") || lname.endsWith(".webp");

    if (isImage) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result ?? "");
        setAttachment({ kind: "image", name: file.name, dataUrl });
      };
      reader.onerror = () => addMessage("assistant", "Failed to read image.");
      reader.readAsDataURL(file);
      return;
    }

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/parse-resume", { method: "POST", body: form });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        addMessage("assistant", `Failed to parse file: ${String(json?.error ?? "unknown")}`);
        return;
      }
      setAttachment({ kind: "text", name: file.name, text: String(json?.text ?? "") });
    } catch {
      addMessage("assistant", "Failed to upload/parse file.");
    }
  }

  function startVoice() {
    const r = speechRef.current;
    if (!r) {
      addMessage("assistant", "Voice input requires Chrome/Edge (Speech Recognition).");
      return;
    }
    try {
      setListening(true);
      r.onresult = (ev: any) => {
        const t = String(ev?.results?.[0]?.[0]?.transcript ?? "").trim();
        if (t) {
          setInput(t);
          setTimeout(() => void sendMessage(t), 0);
        }
      };
      r.onerror = () => {
        setListening(false);
        addMessage("assistant", "Voice input error.");
      };
      r.onend = () => setListening(false);
      r.start();
    } catch {
      setListening(false);
    }
  }

  function quickAction(text: string) {
    setInput(text);
    // auto-send
    setTimeout(() => sendMessage(text), 50);
  }

  async function logMood(newMood: string, note?: string) {
    setMood(newMood);
    try {
      await fetch("/api/companion/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: mockUser.id, mood: newMood, note: note ?? "" }),
      });
    } catch (e) {
      console.warn("mood log failed", e);
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-[#020617] to-[#071029] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left sidebar */}
        <aside className="lg:col-span-2 bg-black/20 p-4 rounded-lg">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">FeelOS</h2>
            <p className="text-xs text-slate-300">Companion</p>
          </div>
          <nav className="space-y-2">
            <a className="block px-3 py-2 rounded hover:bg-white/6" href="/companion">Companion</a>
            <a className="block px-3 py-2 rounded hover:bg-white/6" href="/dashboard/coaches/career">Career Coach</a>
            <a className="block px-3 py-2 rounded hover:bg-white/6" href="/dashboard/coaches/wellbeing">Well‑being Coach</a>
            <a className="block px-3 py-2 rounded hover:bg-white/6" href="/dashboard/coaches/worklife">Work–Life Balance</a>
          </nav>
        </aside>

        {/* Main chat area */}
        <main className="lg:col-span-7 bg-black/30 p-4 rounded-lg flex flex-col">
          <div className="flex-1 overflow-hidden flex flex-col">
            <div ref={messagesRef} className="flex-1 overflow-auto p-3 space-y-3" style={{ scrollbarGutter: "stable" }}>
              {messages.map((m) => (
                <div key={m.id} className={`max-w-[85%] ${m.role === "user" ? "ml-auto text-right" : "mr-auto text-left"}`}>
                  <div className={`inline-block px-4 py-2 rounded-lg ${m.role === "user" ? "bg-linear-to-r from-pink-500 to-yellow-300 text-slate-900" : "bg-white/5"}`}>
                    <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                    <div className="text-xs text-slate-400 mt-1">{new Date(m.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  e.currentTarget.value = "";
                  void onFileSelected(f);
                }}
              />

              {attachment && (
                <div className="mb-2 rounded bg-white/5 border border-white/10 p-2 text-xs text-slate-200 flex items-center justify-between gap-2">
                  <div className="truncate">Attached: <span className="font-medium">{attachment.name}</span></div>
                  <button onClick={() => setAttachment(null)} className="px-2 py-1 rounded bg-white/6">Remove</button>
                </div>
              )}

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={3}
                placeholder="Write a message..."
                className="w-full rounded-md bg-black/20 p-3 text-sm resize-none focus:outline-none"
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-2">
                  <button onClick={() => quickAction("Log mood")} className="px-3 py-1 rounded bg-white/6 text-sm">Log mood</button>
                  <button onClick={() => quickAction("I feel anxious")} className="px-3 py-1 rounded bg-white/6 text-sm">I feel anxious</button>
                  <button onClick={() => quickAction("I feel angry")} className="px-3 py-1 rounded bg-white/6 text-sm">I feel angry</button>
                  <button onClick={() => quickAction("I feel stuck in career")} className="px-3 py-1 rounded bg-white/6 text-sm">I feel stuck in career</button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 mr-2">Mood: <strong className="ml-1">{mood}</strong></span>
                  <button onClick={() => fileInputRef.current?.click()} className="px-3 py-2 rounded bg-white/6 text-sm">Attach</button>
                  <button onClick={startVoice} className="px-3 py-2 rounded bg-white/6 text-sm">{listening ? "Listening…" : "Mic"}</button>
                  <button onClick={() => logMood("happy", "Quick check")} className="px-4 py-2 rounded bg-linear-to-r from-green-400 to-teal-400 text-slate-900 text-sm">Log Happy</button>
                  <button onClick={() => sendMessage()} disabled={sending} className="px-4 py-2 rounded bg-linear-to-r from-pink-500 to-yellow-300 text-slate-900 text-sm">
                    {sending ? "Sending…" : "Send"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Right panel */}
        <aside className="lg:col-span-3 bg-black/20 p-4 rounded-lg">
          <h3 className="font-semibold">Today with FeelOS</h3>
          <div className="mt-3 space-y-4">
            <div className="p-3 bg-white/5 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-300">Current mood</div>
                  <div className="text-lg font-medium">{mood}</div>
                </div>
                {/* simple static avatar reflecting mood */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${mood === 'happy' ? 'bg-yellow-300 text-black' : mood === 'anxious' ? 'bg-rose-600' : 'bg-white/10'}`}>
                  😊
                </div>
              </div>
            </div>

            <div className="p-3 bg-white/5 rounded">
              <div className="text-xs text-slate-300">Today\u2019s focus</div>
              <ol className="list-decimal ml-5 mt-2 text-sm">
                {todayFocus.map((f, i) => <li key={i} className="mt-1">{f}</li>)}
              </ol>
            </div>

            <div className="p-3 bg-white/5 rounded">
              <div className="text-xs text-slate-300">Suggested self-care</div>
              <div className="mt-2 text-sm">{selfCare}</div>
              <button onClick={() => setSelfCare("Do a 5-minute breathing exercise")} className="mt-3 px-3 py-1 rounded bg-white/6 text-sm">Refresh</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
