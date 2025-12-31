'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ResumeOptimizer from '../../../../components/career/ResumeOptimizer';
import LinkedinOptimizer from '../../../../components/career/LinkedinOptimizer';
import CoverLetterGenerator from '../../../../components/career/CoverLetterGenerator';

type CareerTab = 'overview' | 'resume' | 'linkedin' | 'cover' | 'interview' | 'tracker' | 'portfolio';

const FEATURES: Array<{
  key: Exclude<CareerTab, 'overview'>;
  label: string;
  description: string;
  comingSoon: boolean;
}> = [
  {
    key: 'resume',
    label: 'Resume Optimizer',
    description: 'Upload/paste resume, add JD + role, optimize locally.',
    comingSoon: false,
  },
  {
    key: 'linkedin',
    label: 'LinkedIn Optimizer',
    description: 'Generate headline, About section, and tailored suggestions.',
    comingSoon: false,
  },
  {
    key: 'cover',
    label: 'Cover Letter Generator',
    description: 'Paste resume + JD + role → tailored cover letter.',
    comingSoon: false,
  },
  {
    key: 'interview',
    label: 'Interview Prep',
    description: 'Practice common questions and get structured prompts.',
    comingSoon: true,
  },
  {
    key: 'tracker',
    label: 'Job Tracker',
    description: 'Track applications, statuses and follow-ups.',
    comingSoon: true,
  },
  {
    key: 'portfolio',
    label: 'Portfolio Maker',
    description: 'Generate a simple portfolio from your resume/projects.',
    comingSoon: true,
  },
];

export default function CareerCoachPage() {
  const [tab, setTab] = useState<CareerTab>('overview');

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#020617,#071029)] text-foreground">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Career Coach</h1>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl">Personalized career guidance: resume reviews, interview practice and upskilling plans.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-white/6 text-slate-300 border border-white/10">Guest mode</span>
            <Link href="/login" className="text-xs px-3 py-2 rounded-md bg-white/6 hover:bg-white/10 border border-white/10">
              Sign in
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-2">
          <button onClick={() => setTab('overview')} className={`shrink-0 px-3 py-2 rounded-md ${tab==='overview' ? 'bg-white/6' : 'bg-transparent'}`}>Overview</button>
          {FEATURES.map((f) => (
            <button
              key={f.key}
              onClick={() => { if (!f.comingSoon) setTab(f.key); }}
              disabled={f.comingSoon}
              className={`shrink-0 px-3 py-2 rounded-md inline-flex items-center gap-2 ${tab===f.key ? 'bg-white/6' : 'bg-transparent'} ${f.comingSoon ? 'opacity-60 cursor-not-allowed' : ''}`}
              aria-disabled={f.comingSoon}
            >
              <span>{f.label}</span>
              {f.comingSoon && <span className="text-xs text-amber-300 font-medium">Coming soon</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {tab === 'overview' && (
            // OVERVIEW CONTENT
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {FEATURES.map((f) => {
                const clickable = !f.comingSoon;
                return (
                  <div
                    key={f.key}
                    className={`card p-6 transition-transform ${clickable ? 'cursor-pointer hover:scale-[1.02]' : 'opacity-70 cursor-default'}`}
                    role={clickable ? 'button' : undefined}
                    tabIndex={clickable ? 0 : -1}
                    onClick={clickable ? () => setTab(f.key) : undefined}
                    onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') setTab(f.key); } : undefined}
                    aria-disabled={!clickable}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{f.label}</h3>
                        <p className="text-sm text-slate-300 mt-2">
                          {f.description}{f.comingSoon ? ' (coming soon).' : ''}
                        </p>
                      </div>
                      {f.comingSoon ? (
                        <div className="text-xs text-amber-300 font-medium">Coming soon</div>
                      ) : (
                        <div className="text-sm text-slate-400">Open</div>
                      )}
                    </div>
                  </div>
                );
              })}
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
              <p className="text-sm text-slate-300 mt-2">Practice Q&A, STAR prompts, feedback (coming soon).</p>
            </div>
          )}

          {tab === 'tracker' && (
            <div className="card p-6">
              <h3 className="font-semibold">Job Tracker</h3>
              <p className="text-sm text-slate-300 mt-2">Track applications, statuses, and follow-ups (coming soon).</p>
            </div>
          )}

          {tab === 'portfolio' && (
            <div className="card p-6">
              <h3 className="font-semibold">Portfolio Maker</h3>
              <p className="text-sm text-slate-300 mt-2">Generate a simple portfolio from your resume/projects (coming soon).</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
