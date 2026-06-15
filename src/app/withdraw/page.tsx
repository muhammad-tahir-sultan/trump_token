import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentUser } from "@/features/auth/services/session-service";
import { withdrawAction } from "@/features/wallet/actions/wallet-actions";
import { WalletForm } from "@/features/wallet/components/wallet-form";
import { getWalletSummary } from "@/features/wallet/services/wallet-store";

type WithdrawPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function WithdrawPage({ searchParams }: WithdrawPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [wallet, params] = await Promise.all([
    getWalletSummary(user.id),
    searchParams,
  ]);

  return (
    <DashboardShell>
      <div className="h-full overflow-y-auto px-5 py-6 sm:px-8">
        <WalletForm
          action={withdrawAction}
          balanceCents={wallet.balanceCents}
          error={params.error}
          kind="withdraw"
          success={params.success}
        />
      </div>
    </DashboardShell>
  );
}
