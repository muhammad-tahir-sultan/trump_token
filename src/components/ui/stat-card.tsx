type StatCardProps = {
  label: string;
  value: string;
  trend: string;
};

export function StatCard({ label, value, trend }: StatCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-5">
      <p className="text-[10px] font-medium leading-4 text-slate-500 sm:text-sm sm:leading-5">
        {label}
      </p>
      <div className="mt-2 flex flex-col gap-1.5 sm:mt-3 sm:flex-row sm:items-end sm:justify-between sm:gap-2">
        <strong className="min-w-0 text-sm font-bold leading-tight tracking-tight text-slate-950 sm:text-2xl">
          {value}
        </strong>
        <span className="w-fit max-w-full shrink-0 truncate rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 sm:px-2.5 sm:py-1 sm:text-xs">
          {trend}
        </span>
      </div>
    </article>
  );
}
