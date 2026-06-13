import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentUser } from "@/features/auth/services/session-service";
import { CommissionPanel } from "@/features/commission/components/commission-panel";
import { getCommissionPreview } from "@/features/commission/services/commission-service";
import { getWalletSummary } from "@/features/wallet/services/wallet-store";

type CommissionPageProps = {
  searchParams: Promise<{
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
      <div className="h-full overflow-y-auto px-5 py-6 sm:px-8">
        <CommissionPanel
          error={params.error}
          preview={preview}
          success={params.success}
          wallet={wallet}
        />
      </div>
    </DashboardShell>
  );
}
