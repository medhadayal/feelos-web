// components/ui/StatCard.tsx
interface StatCardProps {
  label: string;
  value: string;
  footer?: string;
  badge?: string;
}

export default function StatCard({ label, value, footer, badge }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 px-4 py-4 shadow-sm backdrop-blur">
      {badge && (
        <span className="absolute right-3 top-3 rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-medium text-sky-300">
          {badge}
        </span>
      )}
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {footer && <p className="mt-1 text-[11px] text-slate-400">{footer}</p>}
    </div>
  );
}
