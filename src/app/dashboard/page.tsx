// app/dashboard/page.tsx
'use client';

import Link from "next/link";

export default function DashboardPage() {
	// changed: add comingSoon flag for wellbeing & worklife
	const coaches = [
		{ id: 'career', title: 'Career Coach', desc: 'Resume review, interview prep and growth roadmap.', cta: 'Start Session', accent: 'from-pink-500 to-yellow-300', href: '/dashboard/coaches/career', comingSoon: false },
		{ id: 'wellbeing', title: 'Well‑being Coach', desc: 'Mindfulness, energy & daily routines.', cta: 'Open Guide', accent: 'from-sky-400 to-indigo-400', href: '/dashboard/coaches/wellbeing', comingSoon: true },
		{ id: 'worklife', title: 'Work‑Life Balance', desc: 'Boundary setting & workload planning.', cta: 'Try Now', accent: 'from-green-400 to-teal-300', href: '/dashboard/coaches/worklife', comingSoon: true },
		{ id: 'ai', title: 'AI Companion', desc: 'Conversational companion for reminders & suggestions.', cta: 'Chat Now', accent: 'from-violet-500 to-indigo-400', href: '/dashboard/coaches/ai-companion', comingSoon: false },
	];

	return (
		<main className="min-h-screen bg-[linear-gradient(180deg,#020617,#071029)] text-foreground">
			<div className="max-w-7xl mx-auto px-6 py-8">
				{/* header */}
				<div className="mb-6">
					<h1 className="text-3xl font-semibold">AI Coaches</h1>
					<p className="text-sm text-slate-300 mt-1">Choose a companion to get personalized support</p>
				</div>

				{/* Responsive grid: mobile 1, sm 2, lg 2x2 (cards stretch to fill) */}
				<div
					className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 lg:grid-rows-2 gap-6"
					style={{ minHeight: 'calc(100vh - 6rem)' }} // leaves space for header (h-16 + padding)
				>
					{coaches.map((c) => {
						const card = (
							<div
								key={c.id}
								className={`card h-full flex flex-col justify-between p-6 transition-transform duration-200 ${c.comingSoon ? 'opacity-80 cursor-default' : 'hover:scale-[1.02]'}`}
								role={c.comingSoon ? undefined : 'group'}
								tabIndex={c.comingSoon ? -1 : 0}
								aria-labelledby={`coach-${c.id}-title`}
							>
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-4">
										<div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${c.accent} flex items-center justify-center font-bold text-slate-900 text-lg`} aria-hidden>
											{c.title.split(' ').map(w => w[0]).slice(0,2).join('')}
										</div>
										<div>
											<h3 id={`coach-${c.id}-title`} className="text-lg font-semibold">{c.title}</h3>
											<p className="text-sm text-slate-300 mt-1">{c.desc}</p>
										</div>
									</div>

									{/* show badge for coming soon */}
									{c.comingSoon ? (
										<span className="text-xs text-amber-300 font-medium">Coming soon</span>
									) : (
										<div className="text-sm text-slate-400 self-start">Open</div>
									)}
								</div>

								<div className="mt-4 flex items-center justify-between">
									{c.comingSoon ? (
										<span className="rounded-full bg-white/6 px-3 py-1 text-xs font-medium text-slate-400">{c.cta}</span>
									) : (
										<span className="rounded-full bg-white/6 px-3 py-1 text-xs font-medium">{c.cta}</span>
									)}
									<span className="text-xs text-slate-400">Updated • now</span>
								</div>
							</div>
						);

						// render clickable Link only when not coming soon
						return c.comingSoon ? (
							<div key={c.id} className="block">{card}</div>
						) : (
							<Link key={c.id} href={c.href} className="block" aria-label={c.title}>
								{card}
							</Link>
						);
					})}
				</div>

				{/* ChatWidget removed from dashboard per request */}
			</div>
		</main>
	);
}
