import Link from "next/link";
import { DAILY_DEPOSIT_COMMISSION_RATE } from "@/features/commission/services/commission-service";
import type { Level } from "@/features/levels/types/level";

type LevelDetailHeroProps = {
  level: Level;
};

export function LevelDetailHero({ level }: LevelDetailHeroProps) {
  return (
    <section className="mb-4 sm:mb-6">
      <Link
        className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 sm:text-sm"
        href="/"
      >
        ← Back to Dashboard
      </Link>

      <div
        className={`overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white shadow-lg sm:rounded-[2rem] sm:p-6 ${level.gradientClassName}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80 sm:text-sm">
              Tier Detail
            </p>
            <h1 className="mt-1 text-2xl font-black sm:text-4xl">{level.name}</h1>
            <p className="mt-2 text-sm text-white/90 sm:text-base">
              Daily commission on your total approved deposit amount.
            </p>
          </div>
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black">
            {DAILY_DEPOSIT_COMMISSION_RATE}% Daily
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3">
          <div className="rounded-xl bg-white/15 p-3 sm:rounded-2xl sm:p-4">
            <p className="text-[10px] font-bold uppercase text-white/70 sm:text-xs">
              Min Deposit
            </p>
            <p className="mt-1 text-lg font-black sm:text-2xl">
              {level.minimumDepositLabel}
            </p>
          </div>
          <div className="rounded-xl bg-white/15 p-3 sm:rounded-2xl sm:p-4">
            <p className="text-[10px] font-bold uppercase text-white/70 sm:text-xs">
              Deposit Range
            </p>
            <p className="mt-1 text-sm font-black sm:text-lg">
              {level.depositRangeLabel}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
