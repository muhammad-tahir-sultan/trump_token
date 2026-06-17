import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardContent } from "@/features/dashboard/components/dashboard-content";
import { getCurrentUser } from "@/features/auth/services/session-service";
import { getTodayTeamCommissionCents } from "@/features/commission/services/referral-commission-service";
import {
  getReferralCommissionStatus,
  getWalletSummary,
} from "@/features/wallet/services/wallet-store";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [wallet, referralPreview] = await Promise.all([
    getWalletSummary(user.id),
    getReferralCommissionStatus(user.id),
  ]);
  const todayTeamCommissionCents = getTodayTeamCommissionCents(wallet.transactions);

  return (
    <DashboardShell>
      <DashboardContent
        referralPreview={referralPreview}
        todayTeamCommissionCents={todayTeamCommissionCents}
        user={user}
        wallet={wallet}
      />
    </DashboardShell>
  );
}
