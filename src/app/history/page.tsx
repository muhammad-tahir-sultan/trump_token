import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentUser } from "@/features/auth/services/session-service";
import { ReferralHistory } from "@/features/team/components/referral-history";
import { getWalletSummary, getTransactionHistory } from "@/features/wallet/services/wallet-api";
import { getTeamSummary } from "@/features/team/services/team-api";
import { TransactionHistory } from "@/features/wallet/components/transaction-history";

export default async function HistoryPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [wallet, team] = await Promise.all([
    getWalletSummary(user.id),
    getTeamSummary(user.id),
  ]);

  return (
    <DashboardShell>
      <div className="h-full space-y-6 overflow-y-auto px-5 py-6 sm:px-8">
        <TransactionHistory transactions={wallet.transactions} />
        <ReferralHistory team={team} />
      </div>
    </DashboardShell>
  );
}
