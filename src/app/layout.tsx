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
    icon: "/favicon.jpeg",
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
        <link rel="icon" href="/favicon.jpeg" type="image/jpeg" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {/* persistent header showing logo on all pages */}
        <header className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-7xl px-4">
          <div className="flex items-center justify-between">
            <a href="/" aria-label="FeelOS home" className="flex items-center gap-3">
              <img src="/logo.jpeg" alt="FeelOS" width={40} height={40} className="rounded-md object-contain" />
              <span className="hidden sm:inline-block font-semibold">FeelOS</span>
            </a>

            {/* simple nav/actions placeholder */}
            <nav className="hidden md:flex items-center gap-3">
              <a href="/dashboard" className="text-sm px-3 py-2 rounded-md hover:bg-white/3">Dashboard</a>
              <a href="#" className="text-sm px-3 py-2 rounded-md hover:bg-white/3">Coaches</a>
            </nav>
          </div>
        </header>

        <main className="pt-20 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
