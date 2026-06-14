import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentUser } from "@/features/auth/services/session-service";
import { WithdrawForm } from "@/features/wallet/components/withdraw-form";
import { getWalletSummary } from "@/features/wallet/services/wallet-store";

export default async function WithdrawPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const wallet = await getWalletSummary(user.id);

  return (
    <DashboardShell>
      <div className="h-full overflow-y-auto px-5 py-6 sm:px-8">
        <WithdrawForm balanceCents={wallet.balanceCents} />
      </div>
    </DashboardShell>
  );
}
