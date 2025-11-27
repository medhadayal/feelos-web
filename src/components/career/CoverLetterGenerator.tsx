'use client';

import React, { useState } from "react";

export default function CoverLetterGenerator() {
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [cover, setCover] = useState("");
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    // client-side read for plain-text only; if non-text, ask user to paste
    if (f.type === "text/plain" || f.name.toLowerCase().endsWith(".txt")) {
      try {
        const txt = await f.text();
        setResumeText(txt);
        setNote(null);
      } catch {
        setNote("Unable to read file in browser — paste resume text instead.");
      }
    } else {
      setNote("Non-text file selected. Please paste resume text (PDF/DOCX parsing not available in UI-only mode).");
    }
  }

  function generate() {
    setLoading(true);
    setCover("");
    setTimeout(() => {
      const opener = `Dear Hiring Manager,`;
      const roleLine = `I am writing to apply for the ${jobTitle || "[Job Title]"}${company ? ` at ${company}` : ""}.`;
      const resumeSnippet = resumeText.trim().split(/\n/).map(l=>l.trim()).filter(Boolean).slice(0,6).join(' ');
      const jdSnippet = jobDesc.trim().split(/\n/).map(l=>l.trim()).filter(Boolean).slice(0,6).join(' ');
      const bodyLines = [];
      if (resumeSnippet) bodyLines.push(`In my previous roles, ${resumeSnippet}`);
      if (jdSnippet) bodyLines.push(`The role's focus on ${jdSnippet.split(' ').slice(0,6).join(' ')} particularly interests me and aligns with my experience.`);
      bodyLines.push(`I am confident I can contribute by bringing relevant experience and a results-driven approach.`);
      const closing = `Thank you for considering my application. I look forward to discussing how I can help.`;
      const signature = `Sincerely,\n[Your Name]`;

      const letter = [opener, "", roleLine, "", ...bodyLines.map(b=>b+"\n"), closing, "", signature].join("\n");
      setCover(letter);
      setLoading(false);
    }, 400);
  }

  function downloadTxt() {
    const blob = new Blob([cover || ""], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cover-letter${company ? `-${company.replace(/\s+/g,'-')}`:''}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Cover Letter Generator</h4>
        <span className="text-xs text-slate-400">UI-only</span>
      </div>

      <div className="mt-4 space-y-3">
        <label className="text-xs text-slate-300">Upload resume (optional, .txt)</label>
        <input type="file" accept=".txt" onChange={handleFile} className="mt-2 text-sm" />
        {fileName && <div className="text-xs text-slate-400">Selected: {fileName}</div>}
        {note && <div className="text-xs text-amber-300">{note}</div>}

        <label className="text-xs text-slate-300">Or paste resume highlights</label>
        <textarea value={resumeText} onChange={(e)=>setResumeText(e.target.value)} placeholder="Paste resume bullets or highlights..." className="mt-2 w-full min-h-[120px] rounded-md bg-white/5 p-3 text-sm border border-white/10" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={jobTitle} onChange={(e)=>setJobTitle(e.target.value)} placeholder="Target job title" className="rounded-md bg-white/5 px-3 py-2 text-sm border border-white/10" />
          <input value={company} onChange={(e)=>setCompany(e.target.value)} placeholder="Company (optional)" className="rounded-md bg-white/5 px-3 py-2 text-sm border border-white/10" />
        </div>

        <label className="text-xs text-slate-300">Job description (paste)</label>
        <textarea value={jobDesc} onChange={(e)=>setJobDesc(e.target.value)} placeholder="Paste job description or key requirements..." className="mt-2 w-full min-h-[100px] rounded-md bg-white/5 p-3 text-sm border border-white/10" />

        <div className="flex gap-3">
          <button onClick={generate} disabled={loading} className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold bg-gradient-to-r from-pink-500 to-yellow-300 text-slate-900 shadow">
            {loading ? "Generating…" : "Generate cover letter"}
          </button>
          <button onClick={()=>{ setResumeText(''); setJobTitle(''); setCompany(''); setJobDesc(''); setCover(''); setFileName(null); setNote(null); }} className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm bg-white/6">Clear</button>
        </div>

        <div className="mt-4">
          <h5 className="text-sm font-medium">Suggested Cover Letter</h5>
          <pre className="mt-2 whitespace-pre-wrap rounded-md bg-black/10 p-3 text-sm text-slate-300 min-h-[140px]">
            {cover || <span className="text-slate-500">Generated letter will appear here.</span>}
          </pre>

          <div className="mt-3 flex gap-2">
            <button onClick={()=>navigator.clipboard?.writeText(cover || "")} className="text-sm bg-white/6 px-3 py-1 rounded">Copy</button>
            <button onClick={downloadTxt} className="text-sm bg-white/6 px-3 py-1 rounded" disabled={!cover}>Download .txt</button>
          </div>
        </div>
      </div>
    </div>
  );
}
