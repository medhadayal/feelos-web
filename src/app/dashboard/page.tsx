// app/dashboard/page.tsx
'use client';

import Link from "next/link";

export default function DashboardIndex() {
  const cards = [
    {
      id: 'analytics',
      title: 'Analytics',
      desc: 'Key metrics and trends',
      color: 'from-pink-500 to-yellow-300',
      href: '#',
    },
    {
      id: 'coaches',
      title: 'AI Coaches',
      desc: 'Career, Well‑being, Balance, AI Companion',
      color: 'from-sky-400 to-indigo-400',
      href: '#',
    },
    {
      id: 'projects',
      title: 'Projects',
      desc: 'Active workspaces and tasks',
      color: 'from-green-400 to-teal-300',
      href: '#',
    },
    {
      id: 'activity',
      title: 'Activity',
      desc: 'Recent events & notifications',
      color: 'from-violet-500 to-indigo-400',
      href: '#',
    },
  ];

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Dashboards</h1>
          <p className="text-sm text-muted">Pick a focused view to jump into.</p>
        </div>
        <div className="hidden sm:flex gap-3">
          <button className="rounded-xl px-4 py-2 bg-white/6 hover:bg-white/8 small">Settings</button>
          <button className="rounded-xl px-4 py-2 bg-gradient-to-r from-pink-500 to-yellow-300 text-slate-900 font-semibold">New</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c) => (
          <Link key={c.id} href={c.href} className="block">
            <div className="card h-40 flex flex-col justify-between p-5 hover:scale-[1.02] transition-transform">
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${c.color} flex items-center justify-center font-bold text-slate-900`}>{c.title.split(' ')[0][0]}</div>
                <div className="text-sm text-muted">Open</div>
              </div>

              <div>
                <h3 className="text-lg font-semibold">{c.title}</h3>
                <p className="text-sm text-muted mt-1">{c.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
