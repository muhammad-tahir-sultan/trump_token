import { notFound, redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentUser } from "@/features/auth/services/session-service";
import { LevelDetailHero } from "@/features/levels/components/level-detail-hero";
import { getLevelById } from "@/features/levels/services/level-service";
import { DepositForm } from "@/features/wallet/components/deposit-form";
import { getWalletSummary } from "@/features/wallet/services/wallet-store";

type LevelDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function LevelDetailPage({ params }: LevelDetailPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const level = getLevelById(Number(id));

  if (!level) {
    notFound();
  }

  const wallet = await getWalletSummary(user.id);

  return (
    <DashboardShell>
      <div className="h-full overflow-y-auto px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        <LevelDetailHero level={level} />
        <DepositForm balanceCents={wallet.balanceCents} level={level} />
      </div>
    </DashboardShell>
  );
}
