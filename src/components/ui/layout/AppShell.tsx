// src/components/layout/AppShell.tsx
"use client";

import React from "react";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar – you can replace with your real Sidebar component later */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-sidebar/90">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-2xl bg-primary flex items-center justify-center">
              <span className="text-xs font-semibold text-primary-foreground">
                F
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">
                FeelOS
              </p>
              <p className="text-xs text-muted-foreground">
                Where Technology Feels Human
              </p>
            </div>
          </div>
        </div>

        {/* Add your nav items here */}
        <nav className="flex-1 p-4 space-y-2 text-sm text-sidebar-foreground/80">
          <button className="w-full text-left px-3 py-2 rounded-xl bg-sidebar-accent text-sidebar-accent-foreground">
            Dashboard
          </button>
          <button className="w-full text-left px-3 py-2 rounded-xl hover:bg-sidebar-accent/60 transition">
            Career Coach
          </button>
          <button className="w-full text-left px-3 py-2 rounded-xl hover:bg-sidebar-accent/60 transition">
            Well-Being Coach
          </button>
          <button className="w-full text-left px-3 py-2 rounded-xl hover:bg-sidebar-accent/60 transition">
            Companion
          </button>
        </nav>

        <div className="p-4 border-t border-sidebar-border text-xs text-muted-foreground">
          © {new Date().getFullYear()} FeelOS-AI
        </div>
      </aside>

      {/* Main area */}
      <main className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-16 border-b border-border flex items-center justify-between px-4 md:px-6 bg-background/80 backdrop-blur-sm">
          <div>
            <h1 className="text-base md:text-lg font-semibold tracking-tight">
              FeelOS Dashboard
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Your emotionally intelligent AI operating system
            </p>
          </div>
          {/* Right side – avatar / actions placeholder */}
          <div className="flex items-center gap-3">
            <button className="hidden sm:inline-flex text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground">
              Upgrade to Pro
            </button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-chart-1/80" />
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
