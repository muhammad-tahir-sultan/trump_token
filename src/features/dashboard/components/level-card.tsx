import type { Level } from "@/features/levels/types/level";

type LevelCardProps = {
  level: Level;
};

export function LevelCard({ level }: LevelCardProps) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200">
      <div
        className={`h-36 bg-gradient-to-br ${level.gradientClassName} p-5 text-white`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-white/80">{level.name}</p>
            <h4 className="mt-2 text-3xl font-black">
              {level.dailyCommissionRate}%
            </h4>
          </div>
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black">
            Daily
          </span>
        </div>
        <div className="mt-5 h-12 rounded-2xl bg-white/15 ring-1 ring-white/20" />
      </div>

      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Minimum Deposit
          </p>
          <p className="mt-1 text-xl font-black text-slate-950">
            {level.minimumDepositLabel}
          </p>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
          <span className="text-sm font-semibold text-slate-500">Range</span>
          <span className="text-sm font-black text-slate-950">
            {level.depositRangeLabel}
          </span>
        </div>
      </div>
    </article>
  );
}
