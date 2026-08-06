import { dailyDepositCommissionTiers } from "@/features/commission/services/commission-service";
import type { Level } from "@/features/levels/types/level";

type CommissionSummaryProps = {
  levels: Level[];
};

export function CommissionSummary({ levels }: CommissionSummaryProps) {
  return (
    <aside className="space-y-5" id="summary">
      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">
          Daily Deposit Commission
        </p>
        <div className="mt-4 rounded-3xl bg-slate-950 p-5 text-white">
          <p className="text-sm font-semibold text-indigo-200">
            Highest Rate
          </p>
          <h3 className="mt-2 text-4xl font-black">
            {dailyDepositCommissionTiers.at(-1)?.rate}%
          </h3>
          <p className="mt-2 text-sm text-slate-300">
            Daily commission is selected by total approved deposit amount.
            Wallet balance growth is not included.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-black text-slate-950">Deposit Ladder</h3>
        <div className="mt-5 space-y-4">
          {levels.map((level) => (
            <div className="flex items-center gap-3" key={level.id}>
              <div
                className="grid size-10 shrink-0 place-items-center rounded-2xl text-sm font-black text-white"
                style={{ backgroundColor: level.accentColor }}
              >
                {level.id}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-950">{level.name}</p>
                <p className="text-sm text-slate-500">
                  {level.depositRangeLabel}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-700">
                {level.dailyCommissionRate}%
              </span>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
