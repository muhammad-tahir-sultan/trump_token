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
    backendGet("/dashboard"),
    backendGet("/team"),
  ]);

  const todayKey = getTodayKey();
  const todayTeamCommissionCents = (team?.todayTeamCommissionCents ?? 0);

  return (
    <DashboardShell>
      <DashboardContent
        referralPreview={team?.referralPreview ?? null}
        todayTeamCommissionCents={todayTeamCommissionCents}
        user={user}
        wallet={dashboard?.wallet ?? {}}
      />
    </DashboardShell>
  );
}
