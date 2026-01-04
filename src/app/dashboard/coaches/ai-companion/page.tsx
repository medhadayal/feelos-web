'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bot } from "lucide-react";

type Role = "user" | "assistant" | "system";
type ChatMessage = { id: string; role: Role; text: string };
type ChatThread = { id: string; title: string; messages: ChatMessage[]; updatedAt: number };

const STORAGE_KEY = "feelos.aiCompanion.threads.v1";

const uid = (p = "") => p + Math.random().toString(36).slice(2, 10);

function safeJsonParse<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function useSpeechRecognition() {
  type SpeechRecognitionInstance = {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    onresult: null | ((ev: unknown) => void);
    onerror: null | ((ev: unknown) => void);
    onend: null | (() => void);
  };

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [listening, setListening] = useState(false);

  const supported =
    typeof window !== "undefined" &&
    !!(((window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition) ||
      ((window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition));

  useEffect(() => {
    if (!supported) return;

    const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    const Ctor = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as new () => SpeechRecognitionInstance;

    const r = new Ctor();
    r.continuous = true;
    r.interimResults = false;
    r.lang = "en-US";
    recognitionRef.current = r;
    return () => {
      try {
        r.onresult = null;
        r.onerror = null;
        r.onend = null;
        r.stop?.();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, [supported]);

  const start = useCallback((onText: (t: string) => void, onError?: (msg: string) => void) => {
    const r = recognitionRef.current;
    if (!r) return;
    r.onresult = (ev: unknown) => {
      try {
        const e = ev as { results?: ArrayLike<ArrayLike<{ transcript?: unknown }>> };
        const results = e.results;
        const last = results && results.length ? results[results.length - 1] : null;
        const transcript = last && last.length ? last[0]?.transcript : "";
        const text = String(transcript).trim();
        if (text) onText(text);
      } catch {
        // ignore
      }
    };
    r.onerror = (ev: unknown) => {
      const e = ev as { error?: unknown };
      onError?.(String(e?.error ?? "Speech recognition error"));
    };
    r.onend = () => {
      setListening(false);
    };
    try {
      setListening(true);
      r.start();
    } catch {
      setListening(false);
    }
  }, []);

  const stop = useCallback(() => {
    const r = recognitionRef.current;
    if (!r) return;
    try {
      r.stop();
    } catch {
      // ignore
    }
    setListening(false);
  }, []);

  return { supported, listening, start, stop };
}

export default function AICompanionPage() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [audioCallOn, setAudioCallOn] = useState(false);
  const [videoCallOn, setVideoCallOn] = useState(false);
  const [ttsOn, setTtsOn] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const speech = useSpeechRecognition();

  const activeThread = useMemo(() => threads.find((t) => t.id === activeId) ?? null, [threads, activeId]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? safeJsonParse<ChatThread[]>(raw) : null;
    if (parsed && Array.isArray(parsed) && parsed.length) {
      setThreads(parsed);
      setActiveId(parsed[0].id);
      return;
    }

    const first: ChatThread = {
      id: uid("t_"),
      title: "New chat",
      updatedAt: Date.now(),
      messages: [
        { id: uid("m_"), role: "assistant", text: "Hi — I’m your FeelOS AI Companion. Ask me anything." },
      ],
    };
    setThreads([first]);
    setActiveId(first.id);
  }, []);

  useEffect(() => {
    if (!threads.length) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  }, [threads]);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: "smooth" });
  }, [activeId, activeThread?.messages.length]);

  const speak = useCallback(
    (text: string) => {
      if (!ttsOn) return;
      if (typeof window === "undefined") return;
      if (!("speechSynthesis" in window)) return;
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "en-US";
        u.rate = 1;
        window.speechSynthesis.speak(u);
      } catch {
        // ignore
      }
    },
    [ttsOn]
  );

  const sendMessage = useCallback(
    async (forcedText?: string) => {
      const text = (forcedText ?? input).trim();
      if (!text || sending) return;
      setError(null);
      setInput("");

      const threadId = activeId ?? threads[0]?.id;
      if (!threadId) return;

      const userMsg: ChatMessage = { id: uid("m_"), role: "user", text };
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? {
                ...t,
                title: t.title === "New chat" ? text.slice(0, 32) : t.title,
                updatedAt: Date.now(),
                messages: [...t.messages, userMsg],
              }
            : t
        )
      );

      setSending(true);
      try {
        const baseMessages = (activeThread?.messages ?? []).concat(userMsg);
        const payloadMessages = [
          {
            role: "system",
            content:
              "You are FeelOS AI Companion. Be helpful, direct, and safe. Answer the user’s question clearly. If the user asks for something impossible in-app, suggest a workaround.",
          },
          ...baseMessages
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map((m) => ({ role: m.role, content: m.text })),
        ];

        const res = await fetch("/api/ai/infer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: payloadMessages }),
        });

        const json = (await res.json().catch(() => ({}))) as { reply?: unknown; error?: unknown };
        if (!res.ok) {
          setError(String(json?.error ?? "AI request failed"));
          return;
        }

        const reply = String(json?.reply ?? "").trim() || "(No reply)";
        const assistMsg: ChatMessage = { id: uid("m_"), role: "assistant", text: reply };
        setThreads((prev) =>
          prev.map((t) =>
            t.id === threadId ? { ...t, updatedAt: Date.now(), messages: [...t.messages, assistMsg] } : t
          )
        );
        if (audioCallOn) speak(reply);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      } finally {
        setSending(false);
      }
    },
    [activeId, activeThread?.messages, audioCallOn, input, sending, speak, threads]
  );

  useEffect(() => {
    if (!audioCallOn) {
      speech.stop();
      return;
    }
    if (!speech.supported) {
      setError("Audio call requires Speech Recognition (Chrome/Edge). You can still type.");
      setAudioCallOn(false);
      return;
    }
    speech.start(
      (t) => {
        setInput(t);
        // auto-send after a short tick so state updates
        setTimeout(() => {
          void sendMessage(t);
        }, 0);
      },
      (msg) => {
        setError(msg);
      }
    );
  }, [audioCallOn, sendMessage, speech]);

  useEffect(() => {
    async function startCamera() {
      setCameraError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setCameraError(msg);
        setVideoCallOn(false);
      }
    }

    function stopCamera() {
      const s = mediaStreamRef.current;
      if (s) {
        for (const track of s.getTracks()) track.stop();
      }
      mediaStreamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    }

    if (videoCallOn) void startCamera();
    else stopCamera();

    return () => stopCamera();
  }, [videoCallOn]);

  function newChat() {
    const t: ChatThread = {
      id: uid("t_"),
      title: "New chat",
      updatedAt: Date.now(),
      messages: [{ id: uid("m_"), role: "assistant", text: "Hi — what do you want to work on?" }],
    };
    setThreads((prev) => [t, ...prev]);
    setActiveId(t.id);
    setError(null);
  }

  return (
    <div className="min-h-[calc(100vh-2rem)] w-full text-white">
      <div className="h-[calc(100vh-2rem)] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden grid grid-cols-1 md:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col border-r border-white/10 bg-black/20">
          <div className="p-3 border-b border-white/10">
            <button
              onClick={newChat}
              className="w-full rounded-md bg-white/6 hover:bg-white/10 px-3 py-2 text-sm font-medium"
            >
              New chat
            </button>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-1">
            {threads.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className={`w-full text-left rounded-md px-3 py-2 text-sm ${t.id === activeId ? "bg-white/10" : "hover:bg-white/6"}`}
                title={t.title}
              >
                <div className="truncate">{t.title || "New chat"}</div>
              </button>
            ))}
          </div>
          <div className="p-3 border-t border-white/10 text-xs text-slate-300">
            Uses your configured AI model server-side.
          </div>
        </aside>

        {/* Main */}
        <main className="flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between gap-3 p-3 border-b border-white/10 bg-black/10">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold truncate">
                <span className="inline-flex w-7 h-7 rounded-md bg-linear-to-br from-violet-500 to-indigo-400 items-center justify-center" aria-hidden>
                  <Bot className="w-4 h-4 text-slate-900" />
                </span>
                <span className="truncate">AI Companion</span>
              </div>
              <div className="text-xs text-slate-300 truncate">{activeThread?.title ?? "New chat"}</div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                onClick={() => setTtsOn((v) => !v)}
                className={`px-3 py-2 rounded-md text-xs bg-white/6 hover:bg-white/10 ${ttsOn ? "" : "opacity-70"}`}
              >
                Audio
              </button>

              <button
                onClick={() => setAudioCallOn((v) => !v)}
                className={`px-3 py-2 rounded-md text-xs ${audioCallOn ? "bg-linear-to-r from-green-400 to-teal-400 text-slate-900" : "bg-white/6 hover:bg-white/10"}`}
              >
                {audioCallOn ? "End audio call" : "Audio call"}
              </button>

              <button
                onClick={() => setVideoCallOn((v) => !v)}
                className={`px-3 py-2 rounded-md text-xs ${videoCallOn ? "bg-linear-to-r from-pink-500 to-yellow-300 text-slate-900" : "bg-white/6 hover:bg-white/10"}`}
              >
                {videoCallOn ? "End video call" : "Video call"}
              </button>

              <span className="hidden sm:inline-flex text-xs px-2 py-1 rounded-full bg-white/6 text-slate-300 border border-white/10 ml-1">Guest mode</span>
              <Link
                href="/login"
                className="hidden sm:inline-flex text-xs px-3 py-2 rounded-md bg-white/6 hover:bg-white/10 border border-white/10"
              >
                Sign in
              </Link>
            </div>
          </div>

          {/* Call area */}
          {videoCallOn && (
            <div className="p-3 border-b border-white/10 bg-black/10">
              <div className="flex items-start gap-3">
                <video ref={videoRef} muted playsInline className="w-44 h-28 rounded-lg bg-black/40 border border-white/10 object-cover" />
                <div className="text-xs text-slate-300">
                  <div className="font-medium text-white">Video call</div>
                  <div className="mt-1">Camera preview is local only. Use the chat to talk to the AI.</div>
                  {cameraError && <div className="mt-2 text-amber-200">Camera error: {cameraError}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div ref={chatScrollRef} className="flex-1 overflow-auto p-4 space-y-4 bg-[linear-gradient(180deg,#050816,#0b1221,#020617)]">
            {(activeThread?.messages ?? []).map((m) => (
              <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-2xl px-4 py-3 bg-white/10 border border-white/10"
                      : "max-w-[85%] rounded-2xl px-4 py-3 bg-black/30 border border-white/10"
                  }
                >
                  <div className="whitespace-pre-wrap text-sm text-slate-100">{m.text}</div>
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-black/30 border border-white/10 text-sm text-slate-300">
                  Thinking…
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-white/10 bg-black/20 p-3">
            {error && (
              <div className="mb-3 rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-amber-200">
                {error}
              </div>
            )}
            {!speech.supported && audioCallOn === false && (
              <div className="mb-3 text-xs text-slate-400">Voice input requires Chrome/Edge (Speech Recognition).</div>
            )}
            {audioCallOn && (
              <div className="mb-3 text-xs text-slate-300">{speech.listening ? "Listening… speak now" : "Starting audio call…"}</div>
            )}
            <div className="flex items-end gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={2}
                placeholder="Message AI Companion…"
                className="flex-1 rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm resize-none focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
              />
              <button
                onClick={() => void sendMessage()}
                disabled={!input.trim() || sending}
                className={`px-4 py-3 rounded-xl text-sm font-semibold ${input.trim() && !sending ? "bg-linear-to-r from-pink-500 to-yellow-300 text-slate-900" : "bg-white/6 text-slate-400 cursor-not-allowed"}`}
              >
                Send
              </button>
            </div>
            <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
              <div>Enter to send, Shift+Enter for newline.</div>
              <div className="md:hidden">Uses your configured AI model server-side.</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
