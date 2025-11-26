'use client';

import { useEffect, useState } from 'react';
import Link from "next/link";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      // changed: use same dark gradient as the rest of the pages, overlay above header (z-50)
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#050816] via-[#0b1221] to-[#020617] px-4">
        <div className="text-center flex flex-col items-center justify-center">
          <img
            src="/logo.jpeg"
            alt="FeelOS Logo"
            width={100}
            height={100}
            className="mb-4 object-contain"
          />
          <h1 className="text-4xl font-bold text-white">FeelOS</h1>
          <p className="mt-2 text-white/90">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#050816] via-[#0b1221] to-[#020617] px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Logo */}
        <img
          src="/logo.jpeg"
          alt="FeelOS Logo"
          width={64}
          height={64}
          className="mx-auto object-contain"
        />

        <div>
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">
            Welcome to FeelOS
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Where Technology Feels Human
          </p>
        </div>

        {/* Login card */}
        <div className="rounded-3xl bg-black/40 p-6 shadow-xl border border-white/10 backdrop-blur">
          <div className="space-y-4 text-left">
            <div>
              <label className="text-xs text-slate-300">Email</label>
              <input
                type="email"
                placeholder="medha.dayal@feelos.ai"
                className="mt-1 w-full rounded-xl bg-white/5 px-3 py-2 text-sm outline-none border border-white/10 focus:border-pink-400"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300">Password</label>
              <input
                type="password"
                className="mt-1 w-full rounded-xl bg-white/5 px-3 py-2 text-sm outline-none border border-white/10 focus:border-pink-400"
              />
            </div>
          </div>

          <Link
            href="/dashboard"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-300 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-lg hover:opacity-95"
          >
            Log In →
          </Link>

          <p className="mt-3 text-center text-[11px] text-slate-400">
            Don&apos;t have an account? <span className="text-sky-300">Sign up</span>
          </p>
        </div>
      </div>
    </div>
  );
}
