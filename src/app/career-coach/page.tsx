// app/career-coach/page.tsx
import AppShell from "@/components/UI/layout/AppShell";
import StatCard from "@/components/UI/ui/StatCard";

export default function CareerCoachPage() {
  return (
    <AppShell>
      <section className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-slate-400">Career Coach • AI-powered guidance</p>
            <h1 className="text-2xl font-semibold">Career Coach</h1>
            <p className="text-sm text-slate-400">
              Upload your resume and track your job applications with AI feedback.
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Active Goals" value="3" />
          <StatCard label="Applications" value="12" />
          <StatCard label="Resume Score" value="92%" badge="Updated" />
        </div>

        {/* Resume upload section */}
        <div className="rounded-2xl bg-white/5 border border-dashed border-slate-500/40 p-6 backdrop-blur">
          <h2 className="text-sm font-semibold">Upload Your Resume</h2>
          <p className="mt-1 text-xs text-slate-400">
            Drop your resume here or click to browse. Supports PDF, DOC, DOCX (max 5MB).
          </p>
          <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-slate-500/40 border-dashed py-8 text-center text-xs text-slate-400">
            <div className="mb-3 h-10 w-10 rounded-2xl bg-sky-500/20 flex items-center justify-center">
              ⬆️
            </div>
            <span className="font-medium text-slate-200">
              Drag & drop file or click to upload
            </span>
          </div>
        </div>

        {/* AI feedback section */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur space-y-3">
          <h2 className="text-sm font-semibold">AI Feedback</h2>
          <p className="text-xs text-slate-300">
            Your resume shows strong technical skills! Consider adding more quantifiable
            achievements to make your impact clearer.
          </p>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <button className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-300">
              ✓ Strong Skills Section
            </button>
            <button className="rounded-full bg-pink-500/15 px-3 py-1 text-pink-300">
              + Add Metrics
            </button>
            <button className="rounded-full bg-sky-500/15 px-3 py-1 text-sky-300">
              + Quantify Results
            </button>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
