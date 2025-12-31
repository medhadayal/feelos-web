// src/components/layout/AppShell.tsx
"use client";

import React, { useState } from "react";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside
        id="app-shell-sidebar"
        className={`${
          collapsed ? "w-20" : "w-64"
        } hidden md:flex flex-col border-r border-border bg-sidebar/90 transition-all duration-200 ease-in-out`}
      >
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* sidebar avatar — replaced with inline cartoon SVG */}
            <span className="block">
              <svg
                className="h-8 w-8 rounded-2xl object-cover"
                viewBox="0 0 160 160"
                role="img"
                aria-label="FeelOS avatar"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="feelosGrad" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="#FF6FA1" />
                    <stop offset="60%" stopColor="#FFB86B" />
                    <stop offset="100%" stopColor="#FFD76B" />
                  </linearGradient>
                  <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#000" floodOpacity="0.35" />
                  </filter>
                </defs>

                <g filter="url(#softShadow)">
                  <circle cx="80" cy="80" r="74" fill="url(#feelosGrad)" />
                </g>

                {/* eyes */}
                <g transform="translate(0, -6)">
                  <ellipse cx="56" cy="72" rx="10" ry="12" fill="#fff" />
                  <ellipse cx="104" cy="72" rx="10" ry="12" fill="#fff" />
                  <circle cx="56" cy="74" r="4" fill="#0b1220" />
                  <circle cx="104" cy="74" r="4" fill="#0b1220" />
                </g>

                {/* smile */}
                <path d="M52 98 C70 118, 90 118, 108 98" stroke="#0b1220" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                {/* small accent */}
                <circle cx="52" cy="52" r="5" fill="rgba(255,255,255,0.28)" />
              </svg>
            </span>

            {!collapsed && (
              <div>
                <p className="text-sm font-semibold tracking-tight">FeelOS</p>
                <p className="text-xs text-muted-foreground">
                  Where Technology Feels Human
                </p>
              </div>
            )}
          </div>
          <button
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-controls="app-shell-sidebar"
            aria-expanded={!collapsed}
            aria-pressed={collapsed}
            onClick={() => setCollapsed((s) => !s)}
            className="p-2 rounded hover:bg-white/6 focus-ring transition-all duration-150"
          >
            <svg
              className="w-4 h-4 text-slate-200"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                d={collapsed ? "M9 18l6-6-6-6" : "M15 6l-6 6 6 6"}
              />
            </svg>
          </button>
        </div>

        {/* Add your nav items here */}
        <nav className="flex-1 p-3 space-y-2 text-sm text-sidebar-foreground/80">
          <NavItem collapsed={collapsed} label="Dashboard" href="/dashboard">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeWidth="1.5"
                d="M3 13h8V3H3v10zM13 21h8V11h-8v10z"
              />
            </svg>
          </NavItem>

          <NavItem
            collapsed={collapsed}
            label="Career Coach"
            href="/dashboard/coaches/career"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeWidth="1.5"
                d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20v-1a4 4 0 014-4h8a4 4 0 014 4v1"
              />
            </svg>
          </NavItem>

          <NavItem
            collapsed={collapsed}
            label="Well‑Being Coach"
            href="/dashboard/coaches/wellbeing"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeWidth="1.5"
                d="M12 2l2 7h7l-5.5 4 2 7L12 16 6.5 20l2-7L3 9h7l2-7z"
              />
            </svg>
          </NavItem>
        </nav>

        <div className="p-4 border-t border-sidebar-border text-xs text-muted-foreground flex items-center justify-between">
          {!collapsed ? (
            <span>© {new Date().getFullYear()} FeelOS-AI</span>
          ) : (
            <span className="sr-only">©</span>
          )}
          <button
            aria-label="Settings"
            className="p-1 rounded hover:bg-white/6"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeWidth="1.5"
                d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM19.4 15a1.77 1.77 0 00.33 1.81l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.77 1.77 0 00-1.81-.33 1.77 1.77 0 00-1 1.5V21a2 2 0 01-4 0v-.06a1.77 1.77 0 00-1-1.5 1.77 1.77 0 00-1.81.33l-.06.06A2 2 0 013.27 17.9l.06-.06a1.77 1.77 0 00.33-1.81 1.77 1.77 0 00-1.5-1H3a2 2 0 010-4h.06a1.77 1.77 0 001.5-1 1.77 1.77 0 00-.33-1.81L4.27 3.27A2 2 0 017.1 2.44l.06.06a1.77 1.77 0 001.81.33H9a1.77 1.77 0 001-1.5V2a2 2 0 014 0v.06c.14.68.62 1.2 1.3 1.3.68.14 1.2.62 1.3 1.3V5c0 .6.44 1.06 1.02 1.26.58.2 1.03.63 1.21 1.22.2.58.66 1.02 1.26 1.02h.06a1.77 1.77 0 001.5-1z"
              />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <main className="flex-1 flex flex-col">
        {/* Top bar (softer / semi-transparent) */}
        <header className="h-16 border-b border-border/30 flex items-center justify-between px-4 md:px-6 bg-background/60 backdrop-blur-sm">
          <div>
            <h1 className="text-base md:text-lg font-semibold tracking-tight">
              FeelOS Dashboard
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Your emotionally intelligent AI operating system
            </p>
          </div>

          {/* Search + actions */}
          <div className="flex-1 px-4 mx-4">
            <div className="max-w-lg mx-auto">
              <label className="sr-only">Search</label>
              <input
                placeholder="Search coaches, projects, actions..."
                className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm outline-none border border-white/8 focus:ring-2 focus:ring-[var(--ring)] focus:ring-opacity-60 transition-all duration-150"
              />
            </div>
          </div>

          {/* Right side – avatar / actions */}
          <div className="flex items-center gap-3">
            <button
              className="p-2 rounded-md hover:bg-white/6"
              aria-label="Notifications"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeWidth="1.5"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1"
                />
              </svg>
            </button>

            <button
              className="hidden sm:inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-white/6"
              aria-label="Profile"
            >
              {/* header/profile avatar — replaced with inline cartoon SVG */}
              <svg
                className="h-6 w-6 rounded-full object-cover"
                viewBox="0 0 160 160"
                role="img"
                aria-label="FeelOS profile avatar"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="feelosGradSmall" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="#FF6FA1" />
                    <stop offset="60%" stopColor="#FFB86B" />
                    <stop offset="100%" stopColor="#FFD76B" />
                  </linearGradient>
                </defs>
                <circle cx="80" cy="80" r="80" fill="url(#feelosGradSmall)" />
                <ellipse cx="55" cy="65" rx="6" ry="7" fill="#fff" />
                <ellipse cx="105" cy="65" rx="6" ry="7" fill="#fff" />
                <circle cx="55" cy="66" r="2.5" fill="#0b1220" />
                <circle cx="105" cy="66" r="2.5" fill="#0b1220" />
                <path d="M56 92 C68 104, 92 104, 104 92" stroke="#0b1220" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </svg>

              <span className="text-sm">You</span>
            </button>

            <div className="h-8 w-8 rounded-full bg-linear-to-br from-primary to-chart-1/80" />
          </div>
        </header>

        {/* Page content: remove default padding so pages can be full-bleed */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}

/* NavItem helper component (keeps main file concise) */
function NavItem({
  children,
  label,
  href,
  collapsed,
}: {
  children: React.ReactNode;
  label: string;
  href: string;
  collapsed: boolean;
}) {
  return (
    <a
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/6 transition ${
        collapsed ? "justify-center" : ""
      }`}
      aria-label={label}
    >
      <div className="text-slate-200">{children}</div>
      {!collapsed && <span className="text-sm">{label}</span>}
    </a>
  );
}
