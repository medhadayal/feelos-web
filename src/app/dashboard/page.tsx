// app/dashboard/page.tsx
'use client';

import Link from "next/link";

export default function DashboardPage() {
  const now = "Updated • now";

  return (
    <div className="py-8">
      {/* header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted">Overview — quick access to analytics, coaches, projects and activity.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <input
              aria-label="Search"
              placeholder="Search metrics, projects, coaches..."
              className="rounded-lg bg-white/6 px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
          <button className="rounded-xl px-4 py-2 bg-white/6 hover:bg-white/8 text-sm">Settings</button>
          <button className="rounded-xl px-4 py-2 bg-gradient-to-r from-pink-500 to-yellow-300 text-slate-900 font-semibold text-sm">New</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hero analytics (left) */}
        <div className="lg:col-span-2 hero-card flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Analytics overview</h2>
              <p className="text-sm text-muted mt-1">Real-time metrics, trends and quick actions.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-muted mr-2">{now}</div>
              <button className="rounded-md px-3 py-2 bg-white/6 text-sm">Export</button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-white/3 to-white/2 rounded-xl p-4">
              <p className="text-xs text-muted">Active Users</p>
              <div className="mt-2 text-2xl font-bold">128.4k</div>
              <div className="mt-3 chart-placeholder h-16">sparkline</div>
            </div>
            <div className="bg-gradient-to-br from-white/3 to-white/2 rounded-xl p-4">
              <p className="text-xs text-muted">New Signups</p>
              <div className="mt-2 text-2xl font-bold">5.1k</div>
              <div className="mt-3 chart-placeholder h-16">sparkline</div>
            </div>
            <div className="bg-gradient-to-br from-white/3 to-white/2 rounded-xl p-4">
              <p className="text-xs text-muted">Revenue</p>
              <div className="mt-2 text-2xl font-bold">$1.2M</div>
              <div className="mt-3 chart-placeholder h-16">sparkline</div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium mb-3">Quick insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-lg bg-black/30 p-3 text-sm">Top referrer: example.com</div>
              <div className="rounded-lg bg-black/30 p-3 text-sm">Avg. session: 4m 12s</div>
              <div className="rounded-lg bg-black/30 p-3 text-sm">Bounce rate: 21%</div>
            </div>
          </div>
        </div>

        {/* Right column: stacked cards */}
        <div className="space-y-6">
          <Link href="/dashboard/coaches" className="block">
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">AI Coaches</h4>
                  <p className="text-sm text-muted mt-1">Career · Well‑being · Work‑Life · AI Companion</p>
                </div>
                <div className="text-sm text-muted">{now}</div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-md bg-white/6 p-2 text-xs text-center">Career</div>
                <div className="rounded-md bg-white/6 p-2 text-xs text-center">Well‑being</div>
                <div className="rounded-md bg-white/6 p-2 text-xs text-center">Work‑Life</div>
                <div className="rounded-md bg-white/6 p-2 text-xs text-center">AI Companion</div>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/projects" className="block">
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Projects</h4>
                  <p className="text-sm text-muted mt-1">Active workspaces and tasks</p>
                </div>
                <div className="text-sm text-muted">{now}</div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Project A</div>
                    <div className="text-xs text-muted">In progress • 5 tasks</div>
                  </div>
                  <div className="text-sm text-muted">40%</div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Project B</div>
                    <div className="text-xs text-muted">Paused • 2 tasks</div>
                  </div>
                  <div className="text-sm text-muted">12%</div>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/activity" className="block">
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Recent Activity</h4>
                  <p className="text-sm text-muted mt-1">Latest events & notifications</p>
                </div>
                <div className="text-sm text-muted">{now}</div>
              </div>

              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <div className="font-medium">Alex Johnson signed up</div>
                  <div className="text-xs text-muted">2m ago</div>
                </li>
                <li>
                  <div className="font-medium">Priya Singh upgraded plan</div>
                  <div className="text-xs text-muted">30m ago</div>
                </li>
                <li>
                  <div className="font-medium">Sam Lee created a project</div>
                  <div className="text-xs text-muted">1h ago</div>
                </li>
              </ul>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
