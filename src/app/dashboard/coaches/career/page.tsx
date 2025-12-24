'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ResumeOptimizer from '../../../../components/career/ResumeOptimizer';
import LinkedinOptimizer from '../../../../components/career/LinkedinOptimizer';
import CoverLetterGenerator from '../../../../components/career/CoverLetterGenerator';

type Job = { id: string; company: string; role: string; location?: string; status: string; jdUrl?: string; notes?: string; updatedAt?: string };

export default function CareerCoachPage() {
  const [tab, setTab] = useState<'overview' | 'resume' | 'linkedin' | 'cover' | 'interview' | 'tracker' | 'portfolio'>('overview');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  async function fetchUserId() {
    try {
      const res = await fetch("/api/auth/me", { credentials: "same-origin" });
      const j = await res.json();
      return j?.user?.id || null;
    } catch {
      return null;
    }
  }

  useEffect(() => {
    if (tab !== 'tracker') return;
    (async () => {
      setLoadingJobs(true);
      const uid = await fetchUserId();
      if (!uid) { setJobs([]); setLoadingJobs(false); return; }
      const r = await fetch(`/api/tracker/list?userId=${encodeURIComponent(uid)}`);
      const j = await r.json().catch(() => ({ jobs: [] }));
      setJobs(j.jobs || []);
      setLoadingJobs(false);
    })();
  }, [tab]);

  async function addSample() {
    const uid = await fetchUserId();
    if (!uid) return;
    await fetch('/api/tracker/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: uid, company: "NewCo", role: "Software Engineer", status: "Applied", location: "Remote" }),
    });
    const r = await fetch(`/api/tracker/list?userId=${encodeURIComponent(uid)}`);
    const j = await r.json().catch(() => ({ jobs: [] }));
    setJobs(j.jobs || []);
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#020617,#071029)] text-foreground">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-6">
          <h1 className="text-3xl font-semibold">Career Coach</h1>
          <p className="text-sm text-slate-300 mt-2 max-w-2xl">Personalized career guidance: resume reviews, interview practice and upskilling plans.</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button onClick={() => setTab('overview')} className={`px-3 py-2 rounded-md ${tab==='overview' ? 'bg-white/6' : 'bg-transparent'}`}>Overview</button>
          <button onClick={() => setTab('resume')} className={`px-3 py-2 rounded-md ${tab==='resume' ? 'bg-white/6' : 'bg-transparent'}`}>Resume Optimizer</button>
          <button onClick={() => setTab('linkedin')} className={`px-3 py-2 rounded-md ${tab==='linkedin' ? 'bg-white/6' : 'bg-transparent'}`}>LinkedIn Optimizer</button>
          <button onClick={() => setTab('cover')} className={`px-3 py-2 rounded-md ${tab==='cover' ? 'bg-white/6' : 'bg-transparent'}`}>Cover Letter</button>
          <button onClick={() => setTab('interview')} className={`px-3 py-2 rounded-md ${tab==='interview' ? 'bg-white/6' : 'bg-transparent'}`}>Interview Prep</button>
          <button onClick={() => setTab('tracker')} className={`px-3 py-2 rounded-md ${tab==='tracker' ? 'bg-white/6' : 'bg-transparent'}`}>Job Tracker</button>
          <button onClick={() => setTab('portfolio')} className={`px-3 py-2 rounded-md ${tab==='portfolio' ? 'bg-white/6' : 'bg-transparent'}`}>Portfolio Maker</button>
        </div>

        {/* Content */}
        <div>
          {tab === 'overview' && (
            // OVERVIEW CONTENT
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Resume Optimizer card — activates resume tab */}
              <div
                className="card p-6 cursor-pointer hover:scale-[1.02] transition-transform"
                role="button"
                tabIndex={0}
                onClick={() => setTab('resume')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setTab('resume'); }}
                aria-pressed={tab === 'resume'}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">Resume Optimizer</h3>
                    <p className="text-sm text-slate-300 mt-2">Upload/paste resume, add JD + role, optimize locally.</p>
                  </div>
                  <div className="text-sm text-slate-400">Open</div>
                </div>
              </div>

              {/* LinkedIn Optimizer card — activates linkedin tab */}
              <div
                className="card p-6 cursor-pointer hover:scale-[1.02] transition-transform"
                role="button"
                tabIndex={0}
                onClick={() => setTab('linkedin')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setTab('linkedin'); }}
                aria-pressed={tab === 'linkedin'}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">LinkedIn Optimizer</h3>
                    <p className="text-sm text-slate-300 mt-2">Headline, summary and suggestions — UI-only.</p>
                  </div>
                  <div className="text-sm text-slate-400">Open</div>
                </div>
              </div>

              {/* Cover Letter Generator card — activates cover tab */}
              <div
                className="card p-6 cursor-pointer hover:scale-[1.02] transition-transform"
                role="button"
                tabIndex={0}
                onClick={() => setTab('cover')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setTab('cover'); }}
                aria-pressed={tab === 'cover'}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">Cover Letter Generator</h3>
                    <p className="text-sm text-slate-300 mt-2">Paste resume + JD + role → tailored cover letter.</p>
                  </div>
                  <div className="text-sm text-slate-400">Open</div>
                </div>
              </div>

              {/* Interview Prep card — activates interview tab */}
              <div
                className="card p-6 cursor-pointer hover:scale-[1.02] transition-transform"
                role="button"
                tabIndex={0}
                onClick={() => setTab('interview')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setTab('interview'); }}
                aria-pressed={tab === 'interview'}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">Interview Prep</h3>
                    <p className="text-sm text-slate-300 mt-2">Practice common questions and get structured prompts. This section is a placeholder ready for wiring.</p>
                  </div>
                  <div className="text-sm text-slate-400">Open</div>
                </div>
              </div>

              {/* Job Tracker card — activates tracker tab */}
              <div
                className="card p-6 cursor-pointer hover:scale-[1.02] transition-transform"
                role="button"
                tabIndex={0}
                onClick={() => setTab('tracker')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setTab('tracker'); }}
                aria-pressed={tab === 'tracker'}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">Job Tracker</h3>
                    <p className="text-sm text-slate-300 mt-2">Track applications, statuses and follow-ups. This section is a placeholder ready for wiring.</p>
                  </div>
                  <div className="text-sm text-slate-400">Open</div>
                </div>
              </div>

              {/* Portfolio Maker card — activates portfolio tab */}
              <div
                className="card p-6 cursor-pointer hover:scale-[1.02] transition-transform"
                role="button"
                tabIndex={0}
                onClick={() => setTab('portfolio')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setTab('portfolio'); }}
                aria-pressed={tab === 'portfolio'}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">Portfolio Maker</h3>
                    <p className="text-sm text-slate-300 mt-2">Generate a simple portfolio from your resume/projects. This section is a placeholder ready for wiring.</p>
                  </div>
                  <div className="text-sm text-slate-400">Open</div>
                </div>
              </div>
            </div>
          )}

          {tab === 'resume' && (
            <div className="card p-6">
              <ResumeOptimizer />
            </div>
          )}

          {tab === 'linkedin' && (
            <div className="card p-6">
              <LinkedinOptimizer />
            </div>
          )}

          {tab === 'cover' && (
            <div className="card p-6">
              <CoverLetterGenerator />
            </div>
          )}

          {tab === 'interview' && (
            <div className="card p-6">
              <h3 className="font-semibold">Interview Prep</h3>
              <p className="text-sm text-slate-300 mt-2">Practice common questions and get structured prompts. This section is a placeholder ready for wiring.</p>
              <div className="mt-3 text-xs text-slate-400">Future: Q bank, timers, feedback, exporting notes.</div>
            </div>
          )}

          {tab === 'tracker' && (
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Job Tracker</h3>
                <button onClick={addSample} className="px-3 py-1.5 rounded bg-white/6 text-sm">Add sample</button>
              </div>

              <div className="mt-4 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-slate-300">
                    <tr>
                      <th className="text-left py-2 pr-2">Company</th>
                      <th className="text-left py-2 pr-2">Role</th>
                      <th className="text-left py-2 pr-2">Location</th>
                      <th className="text-left py-2 pr-2">Status</th>
                      <th className="text-left py-2 pr-2">JD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingJobs && <tr><td colSpan={5} className="py-6 text-slate-400">Loading…</td></tr>}
                    {!loadingJobs && jobs.map(j => (
                      <tr key={j.id} className="border-t border-white/10">
                        <td className="py-2 pr-2">{j.company}</td>
                        <td className="py-2 pr-2">{j.role}</td>
                        <td className="py-2 pr-2">{j.location || '-'}</td>
                        <td className="py-2 pr-2">{j.status}</td>
                        <td className="py-2 pr-2">{j.jdUrl ? <a href={j.jdUrl} className="text-blue-300 underline" target="_blank">Link</a> : '-'}</td>
                      </tr>
                    ))}
                    {!loadingJobs && jobs.length === 0 && (
                      <tr><td colSpan={5} className="py-6 text-slate-400">No entries yet. Click “Add sample”.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'portfolio' && (
            <div className="card p-6">
              <h3 className="font-semibold">Portfolio Maker</h3>
              <p className="text-sm text-slate-300 mt-2">Generate a simple portfolio from your resume/projects. This section is a placeholder ready for wiring.</p>
              <div className="mt-3 text-xs text-slate-400">Future: themes, links, hosting/export options.</div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
