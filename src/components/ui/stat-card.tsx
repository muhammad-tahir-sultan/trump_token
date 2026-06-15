type StatCardProps = {
  label: string;
  value: string;
  trend: string;
};

export function StatCard({ label, value, trend }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-5">
      <p className="text-[10px] font-medium text-slate-500 sm:text-sm">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-2 sm:mt-3 sm:gap-3">
        <strong className="text-base font-bold tracking-tight text-slate-950 sm:text-2xl">
          {value}
        </strong>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 sm:px-2.5 sm:py-1 sm:text-xs">
          {trend}
        </span>
      </div>
    </article>
  );
}
