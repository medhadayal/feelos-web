'use client';

import React, { useState } from "react";

function extractKeywords(text: string, limit = 6) {
  if (!text) return [];
  const stop = new Set(['the','and','for','with','a','an','to','of','in','on','by','is','are','as','that','this','will','be','or','from','at','we','you','your','our','i','my']);
  const toks = text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter(t => t.length > 3 && !stop.has(t));
  const freq: Record<string, number> = {};
  for (const t of toks) freq[t] = (freq[t] || 0) + 1;
  return Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0, limit).map(([k])=>k);
}

export default function LinkedinOptimizer() {
  const [profileLink, setProfileLink] = useState("");
  const [profileText, setProfileText] = useState("");
  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [preview, setPreview] = useState({ headline: "", summary: "" });
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);

  function buildSuggestions(raw: string, role?: string) {
    const kws = extractKeywords(raw + (role ? " "+role : ""), 6);
    const s: string[] = [];
    if (!raw.trim()) s.push("Add a short professional summary that includes your top skills and achievements.");
    else {
      s.push("Make first sentence concise and role-oriented.");
      s.push("Add 2–3 bullet-like achievements with metrics if possible.");
    }
    if (kws.length) s.push(`Include keywords: ${kws.join(', ')}`);
    return s;
  }

  function generate() {
    setLoading(true);
    setSuggestions([]);
    setHeadline("");
    setSummary("");
    setPreview({ headline: "", summary: "" });
    setTimeout(() => {
      const raw = profileText || "";
      const kws = extractKeywords(raw, 4);
      const genHeadline = profileLink ? `Profile — ${kws.slice(0,2).join(' · ')}` : (kws[0] ? `${kws[0]} · ${kws.slice(1,2).join(' · ')}` : "Professional · Open to opportunities");
      const genSummary = raw ? (() => {
        const first = raw.split(/\n/).find(Boolean) || raw.slice(0,140);
        const lines = [first.length>220?first.slice(0,220)+'…':first, `Top skills: ${kws.join(', ')}` , "Open to relevant opportunities — highlight measurable impact."];
        return lines.join("\n\n");
      })() : "Add a concise summary highlighting your role, impact, and top skills.";
      const sug = buildSuggestions(raw);
      setHeadline(genHeadline);
      setSummary(genSummary);
      setSuggestions(sug);
      setPreview({ headline: genHeadline, summary: genSummary });
      setLoading(false);
      setNotes(profileLink ? "Profile link provided — live fetch disabled in UI-only mode." : null);
    }, 300);
  }

  function applySuggestions() {
    setPreview({ headline: headline || preview.headline, summary: summary || preview.summary });
  }

  function copyPreview() {
    const text = `Headline:\n${preview.headline}\n\nAbout:\n${preview.summary}`;
    navigator.clipboard?.writeText(text);
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">LinkedIn Profile Optimizer</h4>
        <span className="text-xs text-slate-400">UI-only</span>
      </div>

      <div className="mt-4 space-y-3">
        <label className="text-xs text-slate-300">LinkedIn profile URL (optional)</label>
        <input value={profileLink} onChange={(e)=>setProfileLink(e.target.value)} placeholder="https://www.linkedin.com/in/your-profile" className="w-full rounded-md bg-white/5 px-3 py-2 text-sm border border-white/10" />

        <label className="text-xs text-slate-300">Or paste profile / bio text</label>
        <textarea value={profileText} onChange={(e)=>setProfileText(e.target.value)} placeholder="Paste current LinkedIn About / Summary text..." className="w-full min-h-[120px] rounded-md bg-white/5 p-3 text-sm border border-white/10" />

        <div className="flex gap-3">
          <button onClick={generate} disabled={loading} className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold bg-gradient-to-r from-sky-400 to-indigo-400 text-slate-900 shadow">
            {loading ? "Suggesting…" : "Suggest changes"}
          </button>
          <button onClick={applySuggestions} className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm bg-white/6">Apply suggestions</button>
          <button onClick={()=>{ setProfileLink(''); setProfileText(''); setHeadline(''); setSummary(''); setSuggestions([]); setPreview({headline:'',summary:''}); }} className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm bg-white/6">Clear</button>
        </div>

        {notes && <div className="text-xs text-slate-400">{notes}</div>}

        {suggestions.length > 0 && (
          <div className="mt-3">
            <h5 className="text-sm font-medium">Suggestions</h5>
            <ul className="list-disc ml-5 mt-2 text-sm text-slate-300">
              {suggestions.map((s,i)=>(<li key={i}>{s}</li>))}
            </ul>
          </div>
        )}

        <div className="mt-4">
          <h5 className="text-sm font-medium">Preview (editable)</h5>
          <input value={preview.headline} onChange={(e)=>setPreview(p=>({...p, headline: e.target.value}))} placeholder="Preview headline" className="mt-2 w-full rounded-md bg-black/10 px-3 py-2 text-sm border border-white/10" />
          <textarea value={preview.summary} onChange={(e)=>setPreview(p=>({...p, summary: e.target.value}))} className="mt-2 w-full min-h-[140px] rounded-md bg-black/10 p-3 text-sm border border-white/10" />
          <div className="mt-3 flex gap-2">
            <button onClick={copyPreview} className="text-sm bg-white/6 px-3 py-1 rounded">Copy</button>
            <button onClick={()=>{ const blob=new Blob([`Headline:\n${preview.headline}\n\nSummary:\n${preview.summary}`],{type:'text/plain'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='linkedin-profile.txt'; a.click(); URL.revokeObjectURL(url); }} className="text-sm bg-white/6 px-3 py-1 rounded">Download</button>
          </div>
        </div>
      </div>
    </div>
  );
}
