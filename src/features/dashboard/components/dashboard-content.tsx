import { StatCard } from "@/components/ui/stat-card";
import { CommissionSummary } from "@/features/dashboard/components/commission-summary";
import { DashboardHero } from "@/features/dashboard/components/dashboard-hero";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { LevelGrid } from "@/features/dashboard/components/level-grid";
import type { AuthenticatedUser } from "@/features/auth/types/auth";
import type { ReferralCommissionPreview } from "@/features/commission/services/referral-commission-service";
import { levels } from "@/features/levels/data/levels";
import { formatCurrency } from "@/features/wallet/services/currency";
import type { WalletSummary } from "@/features/wallet/types/wallet";

type DashboardContentProps = {
  user: AuthenticatedUser;
  wallet: WalletSummary;
  todayTeamCommissionCents: number;
  referralPreview: ReferralCommissionPreview;
};

export function DashboardContent({
  user,
  wallet,
  todayTeamCommissionCents,
  referralPreview,
}: DashboardContentProps) {
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
      label: "Daily Commission",
      value: formatCurrency(wallet.totalCommissionCents),
      trend: "Claimed",
    },
    {
      label: "Today Team Commission",
      value: formatCurrency(todayTeamCommissionCents),
      trend: "Today",
    },
    {
      label: "Total Team Commission",
      value: formatCurrency(wallet.totalReferralBonusCents),
      trend: `${referralPreview.teamMemberCount} members`,
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <DashboardHeader user={user} />
      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        <div className="grid gap-4 xl:grid-cols-[1fr_280px] xl:gap-6">
          <div className="space-y-4 sm:space-y-6">
            <DashboardHero />
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
