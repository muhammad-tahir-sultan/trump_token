import { StatCard } from "@/components/ui/stat-card";
import { CommissionSummary } from "@/features/dashboard/components/commission-summary";
import { DashboardHero } from "@/features/dashboard/components/dashboard-hero";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { LevelGrid } from "@/features/dashboard/components/level-grid";
import type { AuthenticatedUser } from "@/features/auth/types/auth";
import { featuredLevel, levels } from "@/features/levels/data/levels";

const summaryStats = [
  {
    label: "Starter Deposit",
    value: "$10",
    trend: "L1",
  },
  {
    label: "Max Daily Rate",
    value: "12%",
    trend: "L5",
  },
  {
    label: "Total Levels",
    value: "5",
    trend: "Live",
  },
];

type DashboardContentProps = {
  user: AuthenticatedUser;
};

export function DashboardContent({ user }: DashboardContentProps) {
  return (
    <div className="flex h-full flex-col">
      <DashboardHeader user={user} />
      <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <DashboardHero level={featuredLevel} />
            <section className="grid gap-4 sm:grid-cols-3" aria-label="Summary">
              {summaryStats.map((stat) => (
                <StatCard
                  key={stat.label}
                  label={stat.label}
                  trend={stat.trend}
                  value={stat.value}
                />
              ))}
            </section>
            <LevelGrid levels={levels} />
          </div>
          <CommissionSummary levels={levels} />
        </div>
      </div>
    </div>
  );
}
