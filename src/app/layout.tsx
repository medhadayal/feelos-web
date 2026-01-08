import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
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
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon.png", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {/* persistent header showing logo on all pages */}
        <header className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-7xl px-4">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" aria-label="FeelOS home" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="FeelOS"
                width={40}
                height={40}
                className="rounded-md object-contain"
                priority
              />
              <span className="hidden sm:inline-block font-semibold">FeelOS</span>
            </Link>

            {/* simple nav/actions */}
            <div className="flex items-center gap-2">
              <nav className="hidden md:flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="text-sm px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground"
                >
                  Dashboard
                </Link>
              </nav>
            </div>
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
