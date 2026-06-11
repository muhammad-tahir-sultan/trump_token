type StatCardProps = {
  label: string;
  value: string;
  trend: string;
};

export function StatCard({ label, value, trend }: StatCardProps) {
  return (
    <article className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <strong className="text-2xl font-bold tracking-tight text-slate-950">
          {value}
        </strong>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">
          {trend}
        </span>
      </div>
    </article>
  );
}
