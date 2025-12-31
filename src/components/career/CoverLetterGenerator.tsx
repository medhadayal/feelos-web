'use client';

import React, { useState } from "react";

type ApiResponse = {
  result?: { cover_letter: string };
  error?: string;
  details?: string;
};

export default function CoverLetterGenerator() {
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [cover, setCover] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<null | 'docx' | 'pdf'>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    setError(null);
    setCover("");

    try {
      setParsing(true);
      const fd = new FormData();
      fd.append('file', f, f.name);
      const res = await fetch('/api/parse-resume', { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error || 'Failed to parse file. Please paste resume text.');
        return;
      }
      setResumeText(json?.text || '');
    } catch {
      setError('Failed to parse file. Please paste resume text.');
    } finally {
      setParsing(false);
    }
  }

  async function generate() {
    setError(null);
    setCover("");

    const resume = resumeText.trim();
    const jd = jobDesc.trim();
    const title = jobTitle.trim();
    if (!resume || !jd || !title) {
      setError('Please provide resume text, job description, and job title.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: resume, jobDesc: jd, jobTitle: title, company }),
      });

      const json = (await res.json().catch(() => ({}))) as ApiResponse;
      if (!res.ok) {
        setError(json?.error || 'Failed to generate cover letter.');
        return;
      }

      setCover(json?.result?.cover_letter || '');
    } catch {
      setError('Failed to generate cover letter.');
    } finally {
      setLoading(false);
    }
  }

  async function download(kind: 'docx' | 'pdf') {
    if (!cover) return;
    setError(null);
    try {
      setDownloading(kind);
      const endpoint = kind === 'docx' ? '/api/generate-docx' : '/api/generate-pdf';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: cover,
          filename: `cover-letter-${company || jobTitle || 'target'}`,
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
      a.download = `cover-letter-${(company || jobTitle || 'target').replace(/[^a-z0-9\-_\.]/gi, '_')}.${kind}`;
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
        <h2 className="text-xl font-semibold">Cover Letter Generator</h2>
        <p className="text-sm text-slate-300 mt-1">Generate a tailored cover letter based on your resume and a job description.</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Resume File (optional)</label>
        <input
          type="file"
          accept=".txt,.pdf,.docx"
          onChange={handleFile}
          className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm"
        />
        {fileName && <p className="text-xs text-slate-400">Selected: {fileName}</p>}
        {parsing && <p className="text-xs text-slate-400">Parsing…</p>}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Job Title</label>
          <input
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm"
            placeholder="e.g., Product Manager"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Company (optional)</label>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm"
            placeholder="e.g., Acme Inc"
          />
        </div>
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

      {error && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-amber-200">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={generate}
          disabled={loading}
          className={`px-4 py-2 rounded-md bg-white/6 text-sm font-medium ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-white/10'}`}
        >
          {loading ? 'Generating…' : 'Generate Cover Letter'}
        </button>
        <button
          onClick={() => {
            setResumeText('');
            setJobTitle('');
            setCompany('');
            setJobDesc('');
            setCover('');
            setFileName(null);
            setError(null);
          }}
          className="px-4 py-2 rounded-md bg-white/6 text-sm font-medium hover:bg-white/10"
        >
          Clear
        </button>
      </div>

      <div className="rounded-xl bg-white/5 border border-white/10 p-4">
        <h3 className="font-semibold">Cover Letter</h3>
        <textarea
          value={cover}
          onChange={(e) => setCover(e.target.value)}
          className="mt-3 w-full rounded-md bg-black/30 border border-white/10 px-3 py-2 text-sm min-h-56"
          placeholder="Your generated letter will appear here."
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => navigator.clipboard?.writeText(cover || '')}
            className="px-4 py-2 rounded-md bg-white/6 text-sm font-medium hover:bg-white/10"
            disabled={!cover}
          >
            Copy
          </button>
          <button
            onClick={() => download('docx')}
            disabled={!cover || downloading !== null}
            className={`px-4 py-2 rounded-md bg-white/6 text-sm font-medium ${(!cover || downloading) ? 'opacity-70 cursor-not-allowed' : 'hover:bg-white/10'}`}
          >
            {downloading === 'docx' ? 'Preparing Word…' : 'Download Word (.docx)'}
          </button>
          <button
            onClick={() => download('pdf')}
            disabled={!cover || downloading !== null}
            className={`px-4 py-2 rounded-md bg-white/6 text-sm font-medium ${(!cover || downloading) ? 'opacity-70 cursor-not-allowed' : 'hover:bg-white/10'}`}
          >
            {downloading === 'pdf' ? 'Preparing PDF…' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
