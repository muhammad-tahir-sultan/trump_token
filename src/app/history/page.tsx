import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentUser } from "@/features/auth/services/session-service";
import { TransactionHistory } from "@/features/wallet/components/transaction-history";
import { getWalletSummary } from "@/features/wallet/services/wallet-store";

export default async function HistoryPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const wallet = await getWalletSummary(user.id);

  return (
    <DashboardShell>
      <div className="h-full overflow-y-auto px-5 py-6 sm:px-8">
        <TransactionHistory transactions={wallet.transactions} />
      </div>
    </DashboardShell>
  );
}
