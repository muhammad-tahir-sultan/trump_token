import { StatCard } from "@/components/ui/stat-card";
import { formatCurrency } from "@/features/wallet/services/currency";
import type { AdminPlatformStats } from "@/features/admin/services/admin-stats-store";

type AdminStatsPanelProps = {
  stats: AdminPlatformStats;
};

export function AdminStatsPanel({ stats }: AdminStatsPanelProps) {
  const statItems = [
    {
      label: "Total Users",
      value: String(stats.totalUsersCount),
      trend: "Active",
    },
    {
      label: "Total Deposits",
      value: formatCurrency(stats.totalDepositedCents),
      trend: "All time",
    },
    {
      label: "Total Withdrawals",
      value: formatCurrency(stats.totalWithdrawnCents),
      trend: "All time",
    },
    {
      label: "Total Wallet Balance",
      value: formatCurrency(stats.totalBalanceCents),
      trend: "Live",
    },
    {
      label: "Today Deposits",
      value: formatCurrency(stats.todayDepositedCents),
      trend: "Today",
    },
    {
      label: "Today Withdrawals",
      value: formatCurrency(stats.todayWithdrawnCents),
      trend: "Today",
    },
    {
      label: "Total Commission Paid",
      value: formatCurrency(stats.totalCommissionCents),
      trend: "Paid",
    },
    {
      label: "Total Referral Paid",
      value: formatCurrency(stats.totalReferralBonusCents),
      trend: "Paid",
    },
    {
      label: "Today Commission",
      value: formatCurrency(stats.todayCommissionCents),
      trend: "Today",
    },
    {
      label: "Today Referral",
      value: formatCurrency(stats.todayReferralBonusCents),
      trend: "Today",
    },
    {
      label: "Pending Deposits",
      value: String(stats.pendingDepositsCount),
      trend: formatCurrency(stats.pendingDepositsCents),
    },
    {
      label: "Pending Withdrawals",
      value: String(stats.pendingWithdrawalsCount),
      trend: formatCurrency(stats.pendingWithdrawalsCents),
    },
  ];

  return (
    <section className="space-y-4 animate-in fade-in duration-200 sm:space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-500 sm:text-sm">
          Platform Overview
        </p>
        <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
          Admin Statistics
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
          Live totals across all users, deposits, withdrawals, and commission activity.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {statItems.map((item) => (
          <StatCard
            key={item.label}
            label={item.label}
            trend={item.trend}
            value={item.value}
          />
        ))}
      </div>
    </section>
  );
}
