// app/dashboard/page.tsx
'use client';

import React from 'react';

export default function DashboardPage() {
  const kpis = [
    { title: "Active Users", value: "128.4k", delta: "+4.2%" },
    { title: "New Signups", value: "5.1k", delta: "+2.1%" },
    { title: "Revenue", value: "$1.2M", delta: "+6.3%" },
    { title: "Conversion", value: "3.8%", delta: "+0.4%" },
  ];

  const activity = [
    { text: "Alex Johnson signed up", time: "2m ago" },
    { text: "Priya Singh upgraded plan", time: "30m ago" },
    { text: "Sam Lee created a project", time: "1h ago" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted">Key insights and AI companions in one place</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="hidden sm:inline-flex rounded-xl px-4 py-2 bg-white/6 hover:bg-white/8 small">Export</button>
          <button className="rounded-xl px-4 py-2 bg-gradient-to-r from-pink-500 to-yellow-300 text-slate-900 font-semibold">New</button>
        </div>
      </div>

      {/* KPI row (4 compact, prominent tiles) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.title} className="card p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">{k.title}</p>
              <p className="mt-1 text-2xl font-bold">{k.value}</p>
            </div>
            <div className="text-right">
              <span className="inline-block text-sm font-medium text-green-400">{k.delta}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid: Coaches | Chart | Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coaches (left on large screens) */}
        <div className="lg:col-span-1 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">AI Coaches</h2>
            <p className="text-sm text-muted small">Career • Well‑being • Balance • AI Companion</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg p-3 bg-gradient-to-br from-white/3 to-white/2">
              <div className="font-semibold">Career Coach</div>
              <p className="text-xs text-muted mt-1">Resume help, interview prep.</p>
            </div>

            <div className="rounded-lg p-3 bg-gradient-to-br from-sky-400/10 to-indigo-400/6">
              <div className="font-semibold">Well‑being</div>
              <p className="text-xs text-muted mt-1">Mindfulness & energy tips.</p>
            </div>

            <div className="rounded-lg p-3 bg-gradient-to-br from-green-400/10 to-emerald-300/6">
              <div className="font-semibold">Work‑Life</div>
              <p className="text-xs text-muted mt-1">Boundaries & planning.</p>
            </div>

            <div className="rounded-lg p-3 bg-gradient-to-br from-violet-500/10 to-indigo-400/6">
              <div className="font-semibold">AI Companion</div>
              <p className="text-xs text-muted mt-1">Chat, reminders, suggestions.</p>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button className="flex-1 rounded-lg px-3 py-2 bg-gradient-to-r from-pink-500 to-yellow-300 text-slate-900 font-semibold">Open All Coaches</button>
            <button className="rounded-lg px-3 py-2 border border-white/8">Settings</button>
          </div>
        </div>

        {/* Traffic chart (prominent center) */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Traffic Overview</h2>
            <div className="text-sm text-muted">Last 7 days</div>
          </div>
          <div className="chart-placeholder">[Chart placeholder — integrate Chart.js / Recharts]</div>
        </div>

        {/* Recent Activity (right column on large screens) */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Recent Activity</h3>
            <a className="text-sm text-sky-300">View all</a>
          </div>

          <ul className="space-y-3">
            {activity.map((a, i) => (
              <li key={i} className="flex items-start justify-between">
                <div>
                  <div className="text-sm">{a.text}</div>
                  <div className="text-xs text-muted mt-1">{a.time}</div>
                </div>
                <div className="text-xs text-muted">•</div>
              </li>
            ))}
          </ul>

          <div className="mt-4">
            <button className="w-full rounded-lg px-3 py-2 bg-white/6">Clear notifications</button>
          </div>
        </div>
      </div>
    </div>
  );
}
