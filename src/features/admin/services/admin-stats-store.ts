import { backendGet } from "@/features/auth/services/backend-api-client";

export type AdminPlatformStats = {
  totalUsersCount: number;
  totalAdminsCount: number;
  totalDepositedCents: number;
  totalWithdrawnCents: number;
  totalBalanceCents: number;
  totalCommissionCents: number;
  totalReferralBonusCents: number;
  todayDepositedCents: number;
  todayWithdrawnCents: number;
  todayCommissionCents: number;
  todayReferralBonusCents: number;
  pendingDepositsCount: number;
  pendingWithdrawalsCount: number;
  pendingDepositsCents: number;
  pendingWithdrawalsCents: number;
};

export async function getAdminPlatformStats(): Promise<AdminPlatformStats> {
  const data = await backendGet("/admin/stats");

  return {
    totalUsersCount: Number(data.totalUsersCount) || 0,
    totalAdminsCount: Number(data.totalAdminsCount) || 0,
    totalDepositedCents: Math.round((Number(data.totalDeposited) || 0) * 100),
    totalWithdrawnCents: Math.round((Number(data.totalWithdrawn) || 0) * 100),
    totalBalanceCents: Math.round((Number(data.totalBalance) || 0) * 100),
    totalCommissionCents: Math.round((Number(data.totalCommission) || 0) * 100),
    totalReferralBonusCents: Math.round((Number(data.totalReferralBonus) || 0) * 100),
    todayDepositedCents: Math.round((Number(data.todayDeposited) || 0) * 100),
    todayWithdrawnCents: Math.round((Number(data.todayWithdrawn) || 0) * 100),
    todayCommissionCents: Math.round((Number(data.todayCommission) || 0) * 100),
    todayReferralBonusCents: Math.round((Number(data.todayReferralBonus) || 0) * 100),
    pendingDepositsCount: Number(data.pendingDepositsCount) || 0,
    pendingWithdrawalsCount: Number(data.pendingWithdrawalsCount) || 0,
    pendingDepositsCents: Math.round((Number(data.pendingDepositsAmount) || 0) * 100),
    pendingWithdrawalsCents: Math.round((Number(data.pendingWithdrawalsAmount) || 0) * 100),
  };
}
