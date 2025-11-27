'use client';

import React from 'react';
import Link from 'next/link';

export default function WorklifeCoachPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#020617,#071029)] text-foreground">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-semibold">Work‑Life Balance Coach</h1>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl">
              Tools and templates to set boundaries, plan work, and protect your personal time to reduce burnout.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/dashboard/coaches/worklife/session" className="inline-block">
                <button className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold bg-gradient-to-r from-green-400 to-teal-300 text-slate-900 shadow">
                  Try a balance plan
                </button>
              </Link>
              <a className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold bg-white/6" href="#features">
                View tips
              </a>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="card p-4">
              <div className="text-sm text-slate-300">Quick actions</div>
              <div className="mt-3 grid grid-cols-1 gap-2">
                <button className="w-full text-left rounded-md px-3 py-2 bg-white/6">Set daily boundaries</button>
                <button className="w-full text-left rounded-md px-3 py-2 bg-white/6">Plan weekly schedule</button>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <section id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <h3 className="font-semibold">Boundary Templates</h3>
            <p className="text-sm text-slate-300 mt-2">Email and calendar templates to communicate availability clearly.</p>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold">Workload Planning</h3>
            <p className="text-sm text-slate-300 mt-2">Simple prioritization frameworks to reduce overload and focus on outcomes.</p>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold">Burnout Prevention</h3>
            <p className="text-sm text-slate-300 mt-2">Signals to watch for and steps to take when you’re approaching burnout.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
