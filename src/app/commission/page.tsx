import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentUser } from "@/features/auth/services/session-service";
import { CommissionPanelClient } from "@/features/commission/components/commission-panel-client";
import { getCommissionPreview } from "@/features/commission/services/commission-service";
import {
  getReferralCommissionStatus,
  getWalletSummary,
} from "@/features/wallet/services/wallet-store";

type CommissionPageProps = {
  searchParams: Promise<{
    claimed?: string;
    referralClaimed?: string;
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

  const [wallet, params, referralPreview] = await Promise.all([
    getWalletSummary(user.id),
    searchParams,
    getReferralCommissionStatus(user.id),
  ]);
  const preview = getCommissionPreview(wallet.totalDepositedCents);

  return (
    <DashboardShell>
      <div className="h-full overflow-y-auto px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        <CommissionPanelClient
          claimedCents={params.claimed ? Number(params.claimed) : 0}
          error={params.error}
          preview={preview}
          referralClaimedCents={
            params.referralClaimed ? Number(params.referralClaimed) : 0
          }
          referralPreview={referralPreview}
          success={params.success}
          wallet={wallet}
        />
      </div>
    </DashboardShell>
  );
}
