import { StatCard } from "@/components/ui/stat-card";
import { CommissionSummary } from "@/features/dashboard/components/commission-summary";
import { DashboardHero } from "@/features/dashboard/components/dashboard-hero";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { LevelGrid } from "@/features/dashboard/components/level-grid";
import type { AuthenticatedUser } from "@/features/auth/types/auth";
import { featuredLevel, levels } from "@/features/levels/data/levels";
import { formatCurrency } from "@/features/wallet/services/currency";
import type { WalletSummary } from "@/features/wallet/types/wallet";

type DashboardContentProps = {
  user: AuthenticatedUser;
  wallet: WalletSummary;
};

export function DashboardContent({ user, wallet }: DashboardContentProps) {
  const summaryStats = [
    {
      label: "Wallet Balance",
      value: formatCurrency(wallet.balanceCents),
      trend: "Live",
    },
    {
      label: "Deposited",
      value: formatCurrency(wallet.totalDepositedCents),
      trend: "Total",
    },
    {
      label: "Referral Bonus",
      value: formatCurrency(wallet.totalReferralBonusCents),
      trend: "Bonus",
    },
    {
      label: "Daily Commission",
      value: formatCurrency(wallet.totalCommissionCents),
      trend: "Claimed",
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader user={user} />
      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        <div className="grid gap-4 xl:grid-cols-[1fr_280px] xl:gap-6">
          <div className="space-y-4 sm:space-y-6">
            <DashboardHero level={featuredLevel} />
            <section className="grid grid-cols-2 gap-3 sm:gap-4" aria-label="Summary">
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
