import { backendGet } from "@/features/auth/services/backend-api-client";
import type { TeamMember, TeamSummary } from "@/features/team/types/team";

export async function getTeamSummary(_userId?: string): Promise<TeamSummary> {
  const data = await backendGet("/users/team");

  const members: TeamMember[] = (data?.members ?? []).map((member: any) => ({
    id: member?._id ?? member?.id ?? "",
    name: member?.fullName ?? member?.name ?? "",
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
