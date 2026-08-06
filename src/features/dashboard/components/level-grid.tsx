import { LevelCard } from "@/features/dashboard/components/level-card";
import type { Level } from "@/features/levels/types/level";

type LevelGridProps = {
  levels: Level[];
};

export function LevelGrid({ levels }: LevelGridProps) {
  return (
    <section id="levels">
      <div className="mb-3 flex items-end justify-between gap-3 sm:mb-5 sm:gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-500 sm:text-sm">
            Level System
          </p>
          <h3 className="mt-1 text-lg font-black tracking-tight text-slate-950 sm:mt-2 sm:text-2xl">
            Deposit Levels
          </h3>
        </div>
        <a className="text-xs font-black text-indigo-600 sm:text-sm" href="#summary">
          See summary
        </a>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-5 xl:grid-cols-3">
        {levels.map((level) => (
          <LevelCard key={level.id} level={level} />
        ))}
      </div>
    </section>
  );
}
