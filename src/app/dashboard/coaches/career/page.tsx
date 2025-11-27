'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ResumeOptimizer from '../../../../components/career/ResumeOptimizer';
import LinkedinOptimizer from '../../../../components/career/LinkedinOptimizer';
import CoverLetterGenerator from '../../../../components/career/CoverLetterGenerator';

export default function CareerCoachPage() {
  const [tab, setTab] = useState<'overview' | 'resume' | 'linkedin' | 'cover'>('overview');

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
        </div>

        {/* Tab content */}
        <div>
          {tab === 'overview' && (
            <>
              {/* AVAILABLE FEATURES */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Available features</h2>
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
                        <p className="text-sm text-slate-300 mt-2">Paste your resume and get a polished, ATS-friendly version.</p>
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
                        <h3 className="font-semibold">LinkedIn Profile Optimizer</h3>
                        <p className="text-sm text-slate-300 mt-2">Generate a headline and summary that highlights your strengths.</p>
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
                        <p className="text-sm text-slate-300 mt-2">Generate tailored cover letters for specific roles and companies.</p>
                      </div>
                      <div className="text-sm text-slate-400">Open</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* COMING SOON FEATURES (updated) */}
              <div>
                <h2 className="text-lg font-semibold mb-3">Coming soon</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card p-6 opacity-80">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">Auto-Apply Jobs</h3>
                        <p className="text-sm text-slate-400 mt-2">Automatically submit your optimized resume to matching roles.</p>
                      </div>
                      <div className="text-xs text-amber-300 font-medium">Coming soon</div>
                    </div>
                  </div>

                  <div className="card p-6 opacity-80">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">Interview Prep</h3>
                        <p className="text-sm text-slate-400 mt-2">Practice interview questions with structured feedback and tips to improve responses.</p>
                      </div>
                      <div className="text-xs text-amber-300 font-medium">Coming soon</div>
                    </div>
                  </div>

                  <div className="card p-6 opacity-80">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">Job Tracker</h3>
                        <p className="text-sm text-slate-400 mt-2">Track applications, stages, and follow-ups in one place.</p>
                      </div>
                      <div className="text-xs text-amber-300 font-medium">Coming soon</div>
                    </div>
                  </div>

                  {/* New coming soon feature: Online Portfolio Maker */}
                  <div className="card p-6 opacity-80">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">Online Portfolio Maker</h3>
                        <p className="text-sm text-slate-400 mt-2">Create a professional portfolio site from your projects and resume content.</p>
                      </div>
                      <div className="text-xs text-amber-300 font-medium">Coming soon</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
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
        </div>
      </div>
    </main>
  );
}
