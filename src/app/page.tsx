'use client';

import { useEffect, useState } from 'react';
	import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const t = setTimeout(() => setIsLoading(false), 900);
		return () => clearTimeout(t);
	}, []);

	if (isLoading) {
		return (
			<div className="loading-screen">
				<div className="loading-inner">
					<Image src="/logo.png" alt="FeelOS" width={96} height={96} className="loading-logo" priority />
					<div className="loading-title">FeelOS</div>
					<div className="loading-subtext">Loading…</div>
					<div className="loading-spinner" />
				</div>
			</div>
		);
	}

	return (
		<main className="relative min-h-screen flex items-center justify-center bg-[linear-gradient(180deg,#020617,#071029)] text-foreground">
			{/* gradient shapes only */}
			<div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
				<div className="absolute -left-32 -top-24 w-80 h-80 rounded-full bg-pink-600/20 blur-3xl" />
				<div className="absolute right-[-6rem] top-24 w-96 h-96 rounded-full bg-indigo-600/16 blur-3xl" />
			</div>

			{/* Centered login card */}
			<div className="z-10 w-full max-w-md px-6 enter-up no-motion">
				<div className="mx-auto backdrop-blur-lg bg-black/50 border border-white/8 rounded-3xl p-8 shadow-xl">
					<div className="flex items-center gap-4 mb-4">
							<Image src="/logo.png" alt="FeelOS Logo" width={56} height={56} className="rounded-md" priority />
						<div>
							<h2 className="text-2xl font-semibold text-white">Welcome to FeelOS</h2>
							<p className="text-sm text-slate-300">Where Technology Feels Human</p>
						</div>
					</div>

					<form className="space-y-4">
						<div>
							<label className="text-xs text-slate-300">Email</label>
							<input
								type="email"
								name="email"
								required
								placeholder="you@company.com"
								className="mt-1 w-full rounded-xl bg-white/5 px-3 py-2 text-sm outline-none border border-white/10 focus:border-pink-400 focus:ring-2 focus:ring-[var(--ring)]"
							/>
						</div>

						<div>
							<label className="text-xs text-slate-300">Password</label>
							<input
								type="password"
								name="password"
								required
								className="mt-1 w-full rounded-xl bg-white/5 px-3 py-2 text-sm outline-none border border-white/10 focus:border-pink-400 focus:ring-2 focus:ring-[var(--ring)]"
							/>
						</div>

						<div className="flex items-center justify-between mt-2">
							<label className="flex items-center gap-2 text-sm text-slate-300">
								<input type="checkbox" className="accent-pink-400" />
								Remember me
							</label>
							<button type="button" className="text-sm text-sky-300">Forgot?</button>
						</div>

						<div className="mt-4">
							<Link href="/dashboard" className="block mt-3">
								<button
									type="button"
									className="w-full inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ease-in-out bg-linear-to-r from-pink-500 via-orange-400 to-yellow-300 text-slate-900 shadow"
								>
									Log In →
								</button>
							</Link>
						</div>

						<p className="mt-3 text-center text-xs text-slate-400">Don’t have an account? <span className="text-sky-300">Sign up</span></p>
					</form>
				</div>
			</div>
		</main>
	);
}
