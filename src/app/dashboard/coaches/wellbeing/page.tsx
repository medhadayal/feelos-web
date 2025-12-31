'use client';

import React from 'react';
import Link from 'next/link';

export default function WellbeingCoachPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#020617,#071029)] text-foreground">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-semibold">Well‑being Coach</h1>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl">
              Practical routines, mindfulness exercises, sleep & nutrition guidance to help you feel your best.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/dashboard/coaches/wellbeing/session" className="inline-block">
                <button className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold bg-linear-to-r from-sky-400 to-indigo-400 text-slate-900 shadow">
                  Start wellbeing session
                </button>
              </Link>
              <a className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold bg-white/6" href="#features">
                View practices
              </a>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="card p-4">
              <div className="text-sm text-slate-300">Quick actions</div>
              <div className="mt-3 grid grid-cols-1 gap-2">
                <button className="w-full text-left rounded-md px-3 py-2 bg-white/6">Start Breathing Exercise</button>
                <button className="w-full text-left rounded-md px-3 py-2 bg-white/6">Daily Check‑in</button>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <section id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <h3 className="font-semibold">Mindfulness</h3>
            <p className="text-sm text-slate-300 mt-2">Guided meditations and short practices to reduce stress and improve focus.</p>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold">Energy Management</h3>
            <p className="text-sm text-slate-300 mt-2">Personalized tips for scheduling tasks around your energy peaks.</p>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold">Sleep & Nutrition</h3>
            <p className="text-sm text-slate-300 mt-2">Small habit changes that improve sleep and daily wellbeing.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
