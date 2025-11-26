import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FeelOS",
  description: "Where Technology Feels Human",
  icons: {
    icon: "/logo.jpeg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.jpeg" type="image/jpeg" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} bg-[var(--background)] text-[var(--foreground)]`}>
        {/* persistent header showing logo on all pages (below loading overlay z-50) */}
        <header className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-7xl px-4">
          <div className="flex items-center justify-between gap-4">
            <a href="/" aria-label="FeelOS home" className="flex items-center gap-3">
              <img src="/logo.jpeg" alt="FeelOS" width={40} height={40} className="rounded-md object-contain" />
              <span className="hidden sm:inline-block font-semibold">FeelOS</span>
            </a>

            <nav className="hidden md:flex items-center gap-3">
              <a href="/dashboard" className="text-sm px-3 py-2 rounded-md hover:bg-white/3">Dashboard</a>
              <a href="#" className="text-sm px-3 py-2 rounded-md hover:bg-white/3">Analytics</a>
              <a href="#" className="text-sm px-3 py-2 rounded-md hover:bg-white/3">Settings</a>
            </nav>

            <div className="flex items-center gap-3">
              <button className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-yellow-300 px-3 py-2 text-sm font-semibold text-slate-900 shadow">
                New
              </button>
              <a href="#" className="rounded-full bg-white/6 p-2">
                <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" /></svg>
              </a>
            </div>
          </div>
        </header>

        {/* page content container (adds top padding to avoid header overlap) */}
        <main className="pt-20 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
