import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardContent } from "@/features/dashboard/components/dashboard-content";
import { getCurrentUser } from "@/features/auth/services/session-service";
import { backendGet } from "@/features/auth/services/backend-api-client";
import { getTodayKey } from "@/features/commission/services/commission-service";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [dashboard, team] = await Promise.all([
    backendGet("/users/dashboard"),
    backendGet("/users/team"),
  ]);

  const todayKey = getTodayKey();
  const todayTeamCommissionCents = (team?.todayTeamCommissionCents ?? 0);

  const emptyReferralPreview = {
    amountCents: 0,
    teamDepositedCents: 0,
    teamMemberCount: 0,
    rate: 0.5,
  };

  return (
    <DashboardShell>
      <DashboardContent
        referralPreview={team?.referralPreview ?? emptyReferralPreview}
        todayTeamCommissionCents={todayTeamCommissionCents}
        user={user}
        wallet={dashboard?.wallet ?? {}}
      />
    </DashboardShell>
  );
}
