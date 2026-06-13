import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentUser } from "@/features/auth/services/session-service";
import { depositAction } from "@/features/wallet/actions/wallet-actions";
import { WalletForm } from "@/features/wallet/components/wallet-form";
import { getWalletSummary } from "@/features/wallet/services/wallet-store";

type DepositPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function DepositPage({ searchParams }: DepositPageProps) {
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
          action={depositAction}
          balanceCents={wallet.balanceCents}
          error={params.error}
          kind="deposit"
          success={params.success}
        />
      </div>
    </DashboardShell>
  );
}
