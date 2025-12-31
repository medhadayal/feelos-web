'use client';

import React, { useState } from 'react';

type OptimizeResponse = {
  result?: {
    ats_score: number | null;
    jd_match_score: number | null;
    section_improvements: Record<string, string[]>;
    optimized_resume: string;
  };
  error?: string;
  details?: string;
};

export default function ResumeOptimizer() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [parsingMsg, setParsingMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [result, setResult] = useState<OptimizeResponse['result'] | null>(null);
  const [downloading, setDownloading] = useState<null | 'docx' | 'pdf'>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setResult(null);
    const f = e.target.files?.[0];
    if (!f) return;

    if (f.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB. Please upload a smaller file.');
      return;
    }

    if (!['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(f.type)) {
      setError('Unsupported file format. Please upload a .txt, .pdf, or .docx file.');
      return;
    }

    setFileName(f.name);
    try {
      setLoadingFile(true);
      if (f.type === 'text/plain' || f.name.toLowerCase().endsWith('.txt')) {
        const txt = await f.text();
        setResumeText(txt);
        setParsingMsg('Loaded text file.');
      } else {
        setParsingMsg('Parsing file...');
        const fd = new FormData();
        fd.append('file', f, f.name);
        const res = await fetch('/api/parse-resume', { method: 'POST', body: fd });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.text) {
          setResumeText(json.text);
          setParsingMsg('Parsed file. Review the text.');
        } else {
          setParsingMsg('Could not parse — please paste resume text.');
        }
      }
    } catch {
      setParsingMsg('Failed to read file — please paste resume text.');
    } finally {
      setLoadingFile(false);
    }
  }

  async function optimize() {
    setError(null);
    setResult(null);

    const resume = resumeText.trim();
    const jd = jobDesc.trim();
    const role = targetRole.trim();
    if (!resume || !jd || !role) {
      setError('Please provide resume text, job description, and target role.');
      return;
    }

    try {
      setOptimizing(true);
      const res = await fetch('/api/resume-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: resume, jobDesc: jd, targetRole: role }),
      });

      const json = (await res.json().catch(() => ({}))) as OptimizeResponse;
      if (!res.ok) {
        setError(json?.error || 'Failed to optimize resume.');
        return;
      }

      setResult(json.result ?? null);
    } catch {
      setError('Failed to optimize resume.');
    } finally {
      setOptimizing(false);
    }
  }

  async function download(kind: 'docx' | 'pdf') {
    if (!result?.optimized_resume) return;
    setError(null);

    try {
      setDownloading(kind);
      const endpoint = kind === 'docx' ? '/api/generate-docx' : '/api/generate-pdf';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: result.optimized_resume,
          filename: `resume-optimized-${targetRole || 'target'}`,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j?.error || `Failed to generate ${kind.toUpperCase()}.`);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-optimized-${(targetRole || 'target').replace(/[^a-z0-9\-_\.]/gi, '_')}.${kind}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(`Failed to download ${kind.toUpperCase()}.`);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Resume Optimizer</h2>
        <p className="text-sm text-slate-300 mt-1">Upload or paste your resume, add a job description, and generate an ATS-friendly version.</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Resume File</label>
        <input
          type="file"
          accept=".txt,.pdf,.docx"
          onChange={handleFile}
          className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm"
        />
        {fileName && <p className="text-xs text-slate-400">Selected: {fileName}</p>}
        {parsingMsg && <p className="text-xs text-slate-400">{parsingMsg}</p>}
        {loadingFile && <p className="text-xs text-slate-400">Parsing…</p>}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Resume Text</label>
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm min-h-40"
          placeholder="Paste your resume text here (or upload a file above)."
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Job Description</label>
        <textarea
          value={jobDesc}
          onChange={(e) => setJobDesc(e.target.value)}
          className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm min-h-28"
          placeholder="Paste the job description here."
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Target Role/Title</label>
        <input
          type="text"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm"
          placeholder="e.g., Software Engineer"
        />
      </div>

      {error && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-amber-200">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={optimize}
          disabled={optimizing}
          className={`px-4 py-2 rounded-md bg-white/6 text-sm font-medium ${optimizing ? 'opacity-70 cursor-not-allowed' : 'hover:bg-white/10'}`}
        >
          {optimizing ? 'Optimizing…' : 'Optimize Resume'}
        </button>
        <span className="text-xs text-slate-400">Uses your configured AI model server-side.</span>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <div className="text-xs text-slate-400">ATS Score</div>
              <div className="text-2xl font-semibold">{result.ats_score ?? '—'}</div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <div className="text-xs text-slate-400">JD Match</div>
              <div className="text-2xl font-semibold">{result.jd_match_score ?? '—'}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => download('docx')}
              disabled={downloading !== null}
              className={`px-4 py-2 rounded-md bg-white/6 text-sm font-medium ${downloading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-white/10'}`}
            >
              {downloading === 'docx' ? 'Preparing Word…' : 'Download Word (.docx)'}
            </button>
            <button
              onClick={() => download('pdf')}
              disabled={downloading !== null}
              className={`px-4 py-2 rounded-md bg-white/6 text-sm font-medium ${downloading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-white/10'}`}
            >
              {downloading === 'pdf' ? 'Preparing PDF…' : 'Download PDF'}
            </button>
            <span className="text-xs text-slate-400">Downloads are generated from the optimized text below.</span>
          </div>

          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <h3 className="font-semibold">Section Improvements</h3>
            <div className="mt-3 space-y-3">
              {Object.keys(result.section_improvements || {}).length === 0 ? (
                <p className="text-sm text-slate-300">No section suggestions returned.</p>
              ) : (
                Object.entries(result.section_improvements).map(([section, items]) => (
                  <div key={section}>
                    <div className="text-sm font-medium">{section}</div>
                    <ul className="mt-2 space-y-1 text-sm text-slate-300">
                      {(items || []).map((it, idx) => (
                        <li key={idx}>• {it}</li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <h3 className="font-semibold">Optimized Resume</h3>
            <textarea
              readOnly
              value={result.optimized_resume || ''}
              className="mt-3 w-full rounded-md bg-black/30 border border-white/10 px-3 py-2 text-sm min-h-56"
            />
          </div>
        </div>
      )}
    </div>
  );
}