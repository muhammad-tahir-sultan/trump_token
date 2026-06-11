import { LevelCard } from "@/features/dashboard/components/level-card";
import type { Level } from "@/features/levels/types/level";

type LevelGridProps = {
  levels: Level[];
};

export function LevelGrid({ levels }: LevelGridProps) {
  return (
    <section id="levels">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-500">
            Level System
          </p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            Daily Commission Tiers
          </h3>
        </div>
        <a className="text-sm font-black text-indigo-600" href="#summary">
          See summary
        </a>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {levels.map((level) => (
          <LevelCard key={level.id} level={level} />
        ))}
      </div>
    </section>
  );
}
