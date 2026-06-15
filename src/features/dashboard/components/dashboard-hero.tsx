import { Badge } from "@/components/ui/badge";
import type { Level } from "@/features/levels/types/level";

type DashboardHeroProps = {
  level: Level;
};

export function DashboardHero({ level }: DashboardHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-slate-950 p-4 text-white shadow-xl shadow-indigo-950/20 sm:rounded-[2rem] sm:p-8">
      <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_center,_rgba(129,140,248,0.55),_transparent_55%)] md:block" />
      <div className="absolute -right-10 -top-12 size-56 rounded-full bg-indigo-500/30 blur-3xl" />
      <div className="relative z-10 max-w-xl">
        <Badge>Top tier level system</Badge>
        <h3 className="mt-4 text-2xl font-black leading-tight tracking-tight sm:mt-6 sm:text-4xl lg:text-5xl">
          Deposit, unlock levels, and earn daily commission.
        </h3>
        <p className="mt-4 max-w-lg text-sm leading-6 text-indigo-100 sm:text-base">
          Start from Level 1 with a $10 minimum deposit and scale up to{" "}
          {level.dailyCommissionRate}% daily commission on the premium tier.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-indigo-50"
            href="/deposit"
          >
            Deposit Now
          </a>
          <a
            className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
            href="/history"
          >
            View History
          </a>
        </div>
      </div>
    </section>
  );
}
