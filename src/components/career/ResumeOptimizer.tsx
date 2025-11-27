'use client';

import { useState } from "react";

export default function ResumeOptimizer() {
  const [resume, setResume] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function optimize() {
    if (!resume.trim()) return;
    setLoading(true);
    setResult("");
    try {
      const messages = [
        { role: "system", content: "You are an expert career coach and resume writer. Optimize the user's resume for clarity, impact, and ATS compatibility. Return a polished resume, keeping important details and improving bullets." },
        { role: "user", content: `Optimize this resume:\n\n${resume}` },
      ];
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      const json = await res.json();
      const assistant = json.assistant?.content ?? "No response";
      setResult(assistant);
    } catch (e) {
      setResult("Request failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <label className="text-sm text-slate-300">Paste your resume (or key sections)</label>
      <textarea
        value={resume}
        onChange={(e) => setResume(e.target.value)}
        className="w-full min-h-[160px] rounded-md bg-white/5 p-3 text-sm outline-none border border-white/10"
        placeholder="Paste your resume here..."
      />
      <div className="flex gap-3">
        <button
          onClick={optimize}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold bg-gradient-to-r from-pink-500 to-yellow-300 text-slate-900 shadow-md"
        >
          {loading ? "Optimizing…" : "Optimize Resume"}
        </button>
        <button
          onClick={() => { setResume(""); setResult(""); }}
          className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium bg-white/6"
        >
          Clear
        </button>
      </div>

      <div>
        <h4 className="text-sm font-semibold">Result</h4>
        <pre className="mt-2 whitespace-pre-wrap rounded-md bg-black/30 p-4 text-sm">{result || (loading ? "Working..." : "No result yet.")}</pre>
      </div>
    </div>
  );
}
