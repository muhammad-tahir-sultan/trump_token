import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentUser } from "@/features/auth/services/session-service";
import { CommissionPanelClient } from "@/features/commission/components/commission-panel-client";
import { getCommissionPreview } from "@/features/commission/services/commission-service";
import { getWalletSummary } from "@/features/wallet/services/wallet-store";

type CommissionPageProps = {
  searchParams: Promise<{
    claimed?: string;
    error?: string;
    success?: string;
  }>;
};

export default async function CommissionPage({
  searchParams,
}: CommissionPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [wallet, params] = await Promise.all([
    getWalletSummary(user.id),
    searchParams,
  ]);
  const preview = getCommissionPreview(wallet.balanceCents);

  return (
    <DashboardShell>
      <div className="h-full overflow-y-auto px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        <CommissionPanelClient
          claimedCents={params.claimed ? Number(params.claimed) : 0}
          error={params.error}
          preview={preview}
          success={params.success}
          wallet={wallet}
        />
      </div>
    </DashboardShell>
  );
}
