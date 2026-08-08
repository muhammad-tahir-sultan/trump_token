import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentUser } from "@/features/auth/services/session-service";
import { LevelDetailHero } from "@/features/levels/components/level-detail-hero";
import { getLevelById } from "@/features/levels/services/level-service";
import { DepositForm } from "@/features/wallet/components/deposit-form";
import { getWalletSummary } from "@/features/wallet/services/wallet-api";

type DepositPageProps = {
  searchParams: Promise<{
    level?: string;
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

  const level = params.level ? getLevelById(Number(params.level)) : null;

  return (
    <DashboardShell>
      <div className="h-full overflow-y-auto px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        {level ? <LevelDetailHero level={level} /> : null}
        <DepositForm balanceCents={wallet.balanceCents} level={level ?? undefined} />
      </div>
    </DashboardShell>
  );
}
