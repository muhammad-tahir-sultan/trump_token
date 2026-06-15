import Link from "next/link";
import type { Level } from "@/features/levels/types/level";

type LevelCardProps = {
  level: Level;
};

export function LevelCard({ level }: LevelCardProps) {
  return (
    <Link
      className="block rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-100 sm:rounded-3xl"
      href={`/levels/${level.id}`}
    >
      <article className="group h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition active:scale-[0.98] sm:rounded-3xl sm:hover:-translate-y-1 sm:hover:shadow-xl sm:hover:shadow-slate-200">
      <div
        className={`h-[5.5rem] bg-gradient-to-br p-3 text-white sm:h-36 sm:p-5 ${level.gradientClassName}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-bold text-white/80 sm:text-sm">
              {level.name}
            </p>
            <h4 className="mt-0.5 text-xl font-black sm:mt-2 sm:text-3xl">
              {level.dailyCommissionRate}%
            </h4>
          </div>
          <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black sm:px-3 sm:py-1 sm:text-xs">
            Daily
          </span>
        </div>
        <div className="mt-3 hidden h-12 rounded-2xl bg-white/15 ring-1 ring-white/20 sm:block" />
      </div>

      <div className="space-y-2 p-3 sm:space-y-4 sm:p-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 sm:text-xs sm:tracking-[0.18em]">
            Min Deposit
          </p>
          <p className="mt-0.5 text-base font-black text-slate-950 sm:mt-1 sm:text-xl">
            {level.minimumDepositLabel}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-2.5 py-2 sm:rounded-2xl sm:px-4 sm:py-3">
          <span className="text-[10px] font-semibold text-slate-500 sm:text-sm">Range</span>
          <span className="truncate text-[10px] font-black text-slate-950 sm:text-sm">
            {level.depositRangeLabel}
          </span>
        </div>
      </div>
      </article>
    </Link>
  );
}
