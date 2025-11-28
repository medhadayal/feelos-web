'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!email && !name) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || null, name: name || null }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert("Login failed: " + (j.error || "unknown"));
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[linear-gradient(180deg,#050816,#0b1221,#020617)] text-white p-4">
      <form onSubmit={submit} className="w-full max-w-md bg-white/5 border border-white/6 p-6 rounded-2xl backdrop-blur-md shadow-xl">
        <h2 className="text-xl font-semibold mb-2">Sign in to FeelOS</h2>
        <p className="text-sm text-slate-300 mb-4">Enter email (or a name) to continue.</p>

        <label className="block text-xs text-slate-300 mb-1">Email (optional)</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mb-3 rounded px-3 py-2 bg-black/10" placeholder="you@example.com" />

        <label className="block text-xs text-slate-300 mb-1">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mb-3 rounded px-3 py-2 bg-black/10" placeholder="Your name" />

        <div className="flex justify-between items-center mt-4">
          <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-gradient-to-r from-pink-500 to-yellow-300 text-slate-900 font-semibold">
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <a href="/" className="text-sm text-slate-300">Back</a>
        </div>
      </form>
    </main>
  );
}
