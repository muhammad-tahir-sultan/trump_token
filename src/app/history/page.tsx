import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentUser } from "@/features/auth/services/session-service";
import { ReferralHistory } from "@/features/team/components/referral-history";
import { getTransactionHistory } from "@/features/wallet/services/wallet-api";
import { getTeamSummary } from "@/features/team/services/team-api";
import { TransactionHistory } from "@/features/wallet/components/transaction-history";

export default async function HistoryPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [transactions, team] = await Promise.all([
    getTransactionHistory(user.id),
    getTeamSummary(user.id),
  ]);

  return (
    <DashboardShell>
      <div className="h-full space-y-6 overflow-y-auto px-5 py-6 sm:px-8">
        <TransactionHistory transactions={transactions} />
        <ReferralHistory team={team} />
      </div>
    </DashboardShell>
  );
}
