import { backendGet } from "@/features/auth/services/backend-api-client";
import type { TeamMember, TeamSummary } from "@/features/team/types/team";

export async function getTeamSummary(_userId?: string): Promise<TeamSummary> {
  const data = await backendGet("/team");

  const members: TeamMember[] = (data.members ?? []).map((member: any) => ({
    id: member._id,
    name: member.fullName,
    email: member.email,
    referralCode: member.referralCode,
    balanceCents: Math.round((member.balance ?? 0) * 100),
    totalDepositedCents: Math.round((member.totalDeposited ?? 0) * 100),
    totalWithdrawnCents: Math.round((member.totalWithdrawn ?? 0) * 100),
    createdAt: new Date(member.createdAt),
  }));

  return {
    members,
    totalMembers: data.stats?.totalMembers ?? members.length,
    totalBalanceCents: Math.round((data.stats?.teamBalance ?? 0) * 100),
    totalDepositedCents: Math.round((data.stats?.teamDeposits ?? 0) * 100),
    totalWithdrawnCents: Math.round((data.stats?.teamWithdrawals ?? 0) * 100),
    todayDepositedCents: 0,
    todayWithdrawnCents: 0,
    todayTeamCommissionCents: 0,
    totalTeamCommissionCents: 0,
  };
}
