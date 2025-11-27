// app/dashboard/page.tsx
'use client';

import Link from "next/link";

export default function DashboardPage() {
  const coaches = [
    { id: 'career', title: 'Career Coach', desc: 'Resume review, interview prep & growth roadmap.', cta: 'Start Session', accent: 'from-pink-500 to-yellow-300', href: '/dashboard/coaches/career' },
    { id: 'wellbeing', title: 'Well‑being Coach', desc: 'Mindfulness, energy & daily routines.', cta: 'Open Guide', accent: 'from-sky-400 to-indigo-400', href: '/dashboard/coaches/wellbeing' },
    { id: 'worklife', title: 'Work‑Life Balance', desc: 'Boundary setting & workload planning.', cta: 'Try Now', accent: 'from-green-400 to-teal-300', href: '/dashboard/coaches/worklife' },
    { id: 'ai', title: 'AI Companion', desc: 'Conversational companion for reminders & suggestions.', cta: 'Chat Now', accent: 'from-violet-500 to-indigo-400', href: '/dashboard/coaches/ai-companion' },
  ];

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#020617,#071029)] text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold">AI Coaches</h1>
          <p className="text-sm text-slate-300 mt-1">Choose a coach to get started</p>
        </div>

        {/* Full-viewport-like 2x2 grid on larger screens, stacked on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6" style={{ minHeight: '65vh' }}>
          {coaches.map((c) => (
            <Link key={c.id} href={c.href} className="block">
              <div className="card h-full flex flex-col justify-between p-8 hover:scale-[1.02] transition-transform">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${c.accent} flex items-center justify-center font-bold text-slate-900 text-xl`} aria-hidden>
                      {c.title.split(' ').map(w => w[0]).slice(0,2).join('')}
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold">{c.title}</h3>
                      <p className="text-sm text-slate-300 mt-2 max-w-lg">{c.desc}</p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-400 self-start">Open</div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <button className="rounded-full bg-white/6 px-5 py-2 text-sm font-medium">{c.cta}</button>
                  <span className="text-xs text-slate-400">Updated • now</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
