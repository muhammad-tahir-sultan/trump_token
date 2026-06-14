import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentUser } from "@/features/auth/services/session-service";
import { DepositForm } from "@/features/wallet/components/deposit-form";
import { getWalletSummary } from "@/features/wallet/services/wallet-store";

export default async function DepositPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const wallet = await getWalletSummary(user.id);

  return (
    <DashboardShell>
      <div className="h-full overflow-y-auto px-5 py-6 sm:px-8">
        <DepositForm balanceCents={wallet.balanceCents} />
      </div>
    </DashboardShell>
  );
}
