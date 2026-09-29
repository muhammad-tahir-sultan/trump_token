import { backendGet } from "@/features/auth/services/backend-api-client";
import type { TeamMember, TeamSummary } from "@/features/team/types/team";

export async function getTeamSummary(userId?: string): Promise<TeamSummary> {
  try {
    const data = await backendGet("/users/team");

    if (data && (Array.isArray(data.members) || data.stats)) {
      const members: TeamMember[] = (data?.members ?? []).map((member: any) => ({
        id: member?._id?.toString() ?? member?.id ?? "",
        name: member?.fullName ?? member?.name ?? "Member",
        email: member?.email ?? "",
        referralCode: member?.referralCode ?? "",
        balanceCents: Math.round((Number(member?.balance) || 0) * 100),
        totalDepositedCents: Math.round((Number(member?.totalDeposited) || 0) * 100),
        totalWithdrawnCents: Math.round((Number(member?.totalWithdrawn) || 0) * 100),
        createdAt: member?.createdAt ? new Date(member.createdAt) : new Date(),
      }));

      return {
        members,
        totalMembers: Number(data?.stats?.totalMembers) || members.length,
        totalBalanceCents: Math.round((Number(data?.stats?.teamBalance) || 0) * 100),
        totalDepositedCents: Math.round((Number(data?.stats?.teamDeposits) || 0) * 100),
        totalWithdrawnCents: Math.round((Number(data?.stats?.teamWithdrawals) || 0) * 100),
        todayDepositedCents: 0,
        todayWithdrawnCents: 0,
        todayTeamCommissionCents: 0,
        totalTeamCommissionCents: 0,
      };
    }
  } catch (err) {
    console.warn("Backend /users/team error, falling back to database team store:", err);
  }

  if (userId) {
    try {
      const { getTeamSummary: getTeamSummaryFromStore } = await import("./team-store");
      return await getTeamSummaryFromStore(userId);
    } catch (dbErr) {
      console.error("Database fallback team store also failed:", dbErr);
    }
  }

  return {
    members: [],
    totalMembers: 0,
    totalBalanceCents: 0,
    totalDepositedCents: 0,
    totalWithdrawnCents: 0,
    todayDepositedCents: 0,
    todayWithdrawnCents: 0,
    todayTeamCommissionCents: 0,
    totalTeamCommissionCents: 0,
  };
}
