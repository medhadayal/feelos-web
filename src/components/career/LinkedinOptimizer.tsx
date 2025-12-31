'use client';

import React, { useState } from "react";

type LinkedinResult = {
  headline: string;
  about: string;
  top_keywords: string[];
  experience_bullets: string[];
  suggestions: string[];
};

type ApiResponse = {
  result?: LinkedinResult;
  error?: string;
  details?: string;
};

export default function LinkedinOptimizer() {
  const [profileText, setProfileText] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<null | 'docx' | 'pdf'>(null);
  const [result, setResult] = useState<LinkedinResult | null>(null);

  async function generate() {
    setError(null);
    setResult(null);

    if (!profileText.trim()) {
      setError("Please paste your current LinkedIn/About text (or a rough profile draft).");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/linkedin-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileText, targetRole, jobDesc }),
      });
      const json = (await res.json().catch(() => ({}))) as ApiResponse;
      if (!res.ok) {
        setError(json?.error || 'Failed to optimize LinkedIn profile.');
        return;
      }
      setResult(json.result || null);
    } catch {
      setError('Failed to optimize LinkedIn profile.');
    } finally {
      setLoading(false);
    }
  }

  function buildExportText(r: LinkedinResult) {
    const lines: string[] = [];
    lines.push('LINKEDIN HEADLINE');
    lines.push(r.headline || '');
    lines.push('');
    lines.push('ABOUT');
    lines.push(r.about || '');
    lines.push('');
    if ((r.top_keywords || []).length) {
      lines.push('TOP KEYWORDS');
      lines.push(r.top_keywords.join(', '));
      lines.push('');
    }
    if ((r.experience_bullets || []).length) {
      lines.push('EXPERIENCE BULLETS');
      for (const b of r.experience_bullets) lines.push(`• ${b}`);
      lines.push('');
    }
    if ((r.suggestions || []).length) {
      lines.push('SUGGESTIONS');
      for (const s of r.suggestions) lines.push(`• ${s}`);
      lines.push('');
    }
    return lines.join('\n');
  }

  async function download(kind: 'docx' | 'pdf') {
    if (!result) return;
    setError(null);
    try {
      setDownloading(kind);
      const endpoint = kind === 'docx' ? '/api/generate-docx' : '/api/generate-pdf';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: buildExportText(result),
          filename: `linkedin-optimized-${targetRole || 'target'}`,
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
      a.download = `linkedin-optimized-${(targetRole || 'target').replace(/[^a-z0-9\-_\.]/gi, '_')}.${kind}`;
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

  function copy() {
    if (!result) return;
    navigator.clipboard?.writeText(buildExportText(result));
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">LinkedIn Optimizer</h2>
        <p className="text-sm text-slate-300 mt-1">Generate an ATS- and recruiter-friendly LinkedIn headline and About section tailored to a role.</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Current LinkedIn/About Text</label>
        <textarea
          value={profileText}
          onChange={(e) => setProfileText(e.target.value)}
          className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm min-h-40"
          placeholder="Paste your current LinkedIn About/Summary (or a draft)."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Target Role/Title (optional)</label>
          <input
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm"
            placeholder="e.g., Data Analyst"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Job Description (optional)</label>
          <textarea
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm min-h-20"
            placeholder="Paste the job description to tailor keywords."
          />
        </div>
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
          {loading ? 'Optimizing…' : 'Optimize LinkedIn'}
        </button>
        <span className="text-xs text-slate-400">Uses your configured AI model server-side.</span>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="text-xs text-slate-400">Headline</div>
            <div className="mt-1 text-sm font-medium">{result.headline}</div>
          </div>

          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="text-xs text-slate-400">About</div>
            <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{result.about}</pre>
          </div>

          {(result.top_keywords || []).length > 0 && (
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <div className="text-xs text-slate-400">Top Keywords</div>
              <div className="mt-2 text-sm text-slate-300">{result.top_keywords.join(', ')}</div>
            </div>
          )}

          {(result.suggestions || []).length > 0 && (
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <div className="text-xs text-slate-400">Suggestions</div>
              <ul className="mt-2 space-y-1 text-sm text-slate-300">
                {result.suggestions.map((s, idx) => (
                  <li key={idx}>• {s}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={copy}
              className="px-4 py-2 rounded-md bg-white/6 text-sm font-medium hover:bg-white/10"
            >
              Copy
            </button>
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
          </div>
        </div>
      )}
    </div>
  );
}
