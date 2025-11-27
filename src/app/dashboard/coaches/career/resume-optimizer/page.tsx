'use client';

import React, { useState } from "react";

/* Helper utilities (local heuristics, no AI) */
function extractKeywords(text: string, limit = 40) {
  if (!text) return [];
  const stop = new Set(["the","and","for","with","a","an","to","of","in","on","by","is","are","as","that","this","will","be","or","from","at","we","you","your","our"]);
  const tokens = text.toLowerCase().replace(/https?:\/\/\S+/g, '').replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(Boolean).filter(t => t.length>3 && !stop.has(t));
  const freq: Record<string, number> = {};
  for (const t of tokens) freq[t] = (freq[t]||0) + 1;
  return Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0, limit).map(([k])=>k);
}

function sectionSplit(resume: string) {
  const headings = ['experience','work experience','professional experience','education','skills','summary','projects','certifications'];
  const lines = resume.split(/\r?\n/);
  const sections: Record<string,string[]> = { Other: [] };
  let current = 'Other';
  for (const raw of lines) {
    const l = raw.trim();
    const low = l.toLowerCase();
    const head = headings.find(h => low === h || low.startsWith(h+':') || low.startsWith(h+' -') || low === h.toUpperCase());
    if (head) { current = head[0].toUpperCase() + head.slice(1); sections[current] = sections[current] || []; continue; }
    sections[current] = sections[current] || [];
    sections[current].push(raw);
  }
  return sections;
}

function generateSectionImprovements(sections: Record<string,string[]>, jdKeywords: string[], roleKeywords: string[]) {
  const out: Record<string,string[]> = {};
  for (const [sec, lines] of Object.entries(sections)) {
    const text = lines.join(' ').toLowerCase();
    const suggestions: string[] = [];
    if (sec.toLowerCase().includes('experience')) {
      if (!/\d/.test(text)) suggestions.push('Add numeric metrics to impact statements where possible.');
      suggestions.push('Lead with action verbs and remove passive phrasing.');
      const missing = jdKeywords.slice(0,6).filter(k => !text.includes(k));
      if (missing.length) suggestions.push(`Consider adding keywords: ${missing.join(', ')}`);
    } else if (sec.toLowerCase().includes('skills')) {
      suggestions.push('List core technical skills in a short, comma-separated line.');
    } else if (sec.toLowerCase().includes('summary')) {
      suggestions.push('Make the summary role-specific and mention top achievements.');
    } else {
      suggestions.push('Ensure formatting and dates are consistent.');
    }
    out[sec] = suggestions;
  }
  return out;
}

function generateOptimizedResume(resume: string, jdKeywords: string[], roleKeywords: string[]) {
  const lines = resume.split(/\r?\n/);
  const out: string[] = [];
  for (const raw of lines) {
    const l = raw.trim();
    if (!l) { out.push(''); continue; }
    if (/^[-•*]\s+/.test(l) || /^\d+\.\s+/.test(l) || (l.length < 80 && l.endsWith(':'))) {
      let bullet = l.replace(/^[-•*\d\.\)\s]+/,'').trim();
      bullet = bullet[0]?.toUpperCase() + bullet.slice(1);
      if (!/\d/.test(bullet)) bullet += ' [add metric]';
      for (const k of [...jdKeywords,...roleKeywords]) {
        const re = new RegExp(`\\b${k}\\b`,'ig');
        bullet = bullet.replace(re, m => m.toUpperCase());
      }
      out.push('- ' + bullet);
    } else {
      let paragraph = l;
      for (const k of [...jdKeywords,...roleKeywords]) {
        const re = new RegExp(`\\b${k}\\b`,'ig');
        paragraph = paragraph.replace(re, m => m.toUpperCase());
      }
      out.push(paragraph);
    }
  }
  return out.join('\n');
}

/* Page component */
export default function ResumeOptimizerPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [quickScore, setQuickScore] = useState<number | null>(null);

  const [jobDesc, setJobDesc] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [location, setLocation] = useState('');

  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [jdMatchScore, setJdMatchScore] = useState<number | null>(null);
  const [sectionImprovements, setSectionImprovements] = useState<Record<string,string[]>>({});
  const [optimizedResume, setOptimizedResume] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string| null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    // quick client-side read for txt
    if (f.type === 'text/plain' || f.name.toLowerCase().endsWith('.txt')) {
      try {
        const t = await f.text();
        setResumeText(t);
        computeQuickScore(t);
        return;
      } catch {
        // fallback to server
      }
    }
    // upload to server parser
    try {
      setParsing(true);
      const fd = new FormData();
      fd.append('file', f, f.name);
      const res = await fetch('/api/parse-resume', { method: 'POST', body: fd });
      const json = await res.json();
      if (res.ok && json.text) {
        setResumeText(json.text);
        computeQuickScore(json.text);
      } else {
        setError(json.error || 'Could not parse file — paste resume text');
        setResumeText('');
        setQuickScore(null);
      }
    } catch (err: any) {
      setError('Upload failed — paste resume text');
      setResumeText('');
      setQuickScore(null);
    } finally {
      setParsing(false);
    }
  }

  function computeQuickScore(text: string) {
    // simple heuristic: presence of sections and metrics
    const hasExperience = /experience/i.test(text);
    const hasSkills = /skills/i.test(text);
    const hasEducation = /education/i.test(text);
    const hasNumbers = /\d/.test(text);
    const score = Math.round(((+hasExperience + +hasSkills + +hasEducation) * 25) + (hasNumbers ? 25 : 0)); // 0-100
    setQuickScore(score);
  }

  function resetResults() {
    setAtsScore(null);
    setJdMatchScore(null);
    setSectionImprovements({});
    setOptimizedResume(null);
    setError(null);
  }

  async function generateOptimize() {
    setError(null);
    if (!resumeText.trim()) { setError('Please upload or paste your resume.'); return; }
    if (!targetRole.trim() || !jobDesc.trim()) { setError('Please provide job description and target role to compute ATS & optimize.'); return; }

    setLoading(true);
    resetResults();

    try {
      // compute keywords
      const jdKeywords = extractKeywords(jobDesc + ' ' + targetRole, 40);
      const roleKeywords = extractKeywords(targetRole, 20);
      // ATS/JD match heuristics
      const resumeLower = resumeText.toLowerCase();
      const matchedJD = jdKeywords.filter(k => resumeLower.includes(k));
      const matchedRole = roleKeywords.filter(k => resumeLower.includes(k));
      const ats = jdKeywords.length ? Math.round((matchedJD.length / jdKeywords.length) * 100) : 0;
      const jdMatch = roleKeywords.length ? Math.round((matchedRole.length / roleKeywords.length) * 100) : 0;

      const sections = sectionSplit(resumeText);
      const improvements = generateSectionImprovements(sections, jdKeywords, roleKeywords);
      const optimized = generateOptimizedResume(resumeText, jdKeywords, roleKeywords);

      setAtsScore(ats);
      setJdMatchScore(jdMatch);
      setSectionImprovements(improvements);
      setOptimizedResume(optimized);
    } catch (err: any) {
      setError('Optimization failed.');
    } finally {
      setLoading(false);
    }
  }

  function downloadTxt() {
    if (!optimizedResume) return;
    const blob = new Blob([optimizedResume], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${fileName ? fileName.replace(/\.[^/.]+$/, '') + '-optimized.txt' : 'resume-optimized.txt'}`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function downloadDoc() {
    if (!optimizedResume) return;
    const blob = new Blob([optimizedResume], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${fileName ? fileName.replace(/\.[^/.]+$/, '') + '-optimized.doc' : 'resume-optimized.doc'}`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#020617,#071029)] text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold mb-3">Resume Optimizer</h1>
        <p className="text-sm text-slate-300 mb-6">Upload your resume (PDF / DOCX / DOC / TXT). Provide the job description and target role to compute ATS score and optimize your resume. This is local heuristic optimization (no AI).</p>

        <div className="card p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm">Upload resume (PDF / DOCX / DOC / TXT)</label>
              <input type="file" accept=".pdf,.docx,.doc,.txt" onChange={handleFile} className="mt-2 text-sm" />
              {parsing && <div className="text-xs text-slate-400 mt-2">Parsing file…</div>}
              {fileName && <div className="text-xs text-slate-400 mt-2">Loaded: {fileName}</div>}
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-400">Quick resume readiness</div>
              <div className="text-2xl font-bold">{quickScore !== null ? quickScore : '—'}</div>
              <div className="text-xs text-slate-400">Baseline</div>
            </div>
          </div>
        </div>

        <div className="card p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm">Job description (paste text or link)</label>
              <textarea value={jobDesc} onChange={(e)=>setJobDesc(e.target.value)} className="mt-2 w-full min-h-[120px] rounded-md bg-white/5 p-3 text-sm border border-white/10" placeholder="Paste job description..." />
            </div>
            <div>
              <label className="text-sm">Target role / title</label>
              <input value={targetRole} onChange={(e)=>setTargetRole(e.target.value)} placeholder="e.g. Backend SWE L4 - Google" className="mt-2 w-full rounded-md bg-white/5 px-3 py-2 text-sm border border-white/10" />
              <label className="text-sm mt-3 block">Location (optional)</label>
              <input value={location} onChange={(e)=>setLocation(e.target.value)} placeholder="e.g. San Francisco, CA" className="mt-2 w-full rounded-md bg-white/5 px-3 py-2 text-sm border border-white/10" />
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button onClick={generateOptimize} disabled={loading} className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold bg-gradient-to-r from-pink-500 to-yellow-300 text-slate-900 shadow">
              {loading ? 'Optimizing…' : 'Optimize Resume'}
            </button>
            <button onClick={() => { setJobDesc(''); setTargetRole(''); setLocation(''); resetResults(); }} className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm bg-white/6">Reset</button>
          </div>
        </div>

        {error && <div className="text-sm text-rose-400 mb-4">{error}</div>}

        {(atsScore !== null || jdMatchScore !== null || Object.keys(sectionImprovements).length > 0 || optimizedResume) && (
          <div className="space-y-4">
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Scores</h3>
                  <p className="text-sm text-slate-300">ATS and JD match (heuristic)</p>
                </div>
                <div className="flex gap-6 items-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{atsScore ?? '—'}</div>
                    <div className="text-xs text-slate-400">ATS score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{jdMatchScore ?? '—'}</div>
                    <div className="text-xs text-slate-400">JD match</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <h4 className="font-semibold">Section-wise improvements</h4>
              <div className="mt-3 space-y-3">
                {Object.keys(sectionImprovements).length === 0 ? (
                  <div className="text-sm text-slate-400">No improvements found.</div>
                ) : (
                  Object.entries(sectionImprovements).map(([section, items]) => (
                    <div key={section}>
                      <div className="text-sm font-medium">{section}</div>
                      <ul className="list-disc ml-5 mt-1 text-sm text-slate-300">
                        {items.map((it, i) => <li key={i}>{it}</li>)}
                      </ul>
                    </div>
                  ))
                }
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Optimized resume</h4>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigator.clipboard?.writeText(optimizedResume ?? '')} className="text-sm bg-white/6 px-3 py-1 rounded">Copy</button>
                  <button onClick={downloadDoc} className="text-sm bg-white/6 px-3 py-1 rounded">Download .doc</button>
                  <button onClick={downloadTxt} className="text-sm bg-white/6 px-3 py-1 rounded">Download .txt</button>
                </div>
              </div>
              <pre className="mt-3 whitespace-pre-wrap text-sm">{optimizedResume ?? 'No optimized resume yet.'}</pre>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
