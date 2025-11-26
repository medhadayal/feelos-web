// components/ui/CoachCard.tsx
import Link from "next/link";

interface CoachCardProps {
  title: string;
  description: string;
  href: string;
  iconBg: string; // tailwind color class like "from-sky-500 to-cyan-400"
  statLabel?: string;
  statValue?: string;
}

export default function CoachCard({
  title,
  description,
  href,
  iconBg,
  statLabel,
  statValue,
}: CoachCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-2xl bg-white/5 border border-white/10 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${iconBg}`}
        >
          <span className="text-lg">💼</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-400">{description}</p>
        </div>
      </div>

      {statLabel && statValue && (
        <div className="mt-3 text-xs text-slate-400">
          <span className="font-medium text-slate-100">{statValue}</span>{" "}
          {statLabel}
        </div>
      )}

      <Link
        href={href}
        className="mt-4 inline-flex items-center text-xs font-medium text-sky-300 hover:text-sky-200"
      >
        Launch Coach →
      </Link>
    </div>
  );
}
