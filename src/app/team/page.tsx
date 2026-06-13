import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentUser } from "@/features/auth/services/session-service";
import { TeamOverview } from "@/features/team/components/team-overview";
import { getTeamSummary } from "@/features/team/services/team-store";

export default async function TeamPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const team = await getTeamSummary(user.id);

  return (
    <DashboardShell>
      <div className="h-full overflow-y-auto px-5 py-6 sm:px-8">
        <TeamOverview referralCode={user.referralCode} team={team} />
      </div>
    </DashboardShell>
  );
}
