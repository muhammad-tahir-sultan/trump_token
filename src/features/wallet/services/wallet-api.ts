import { backendGet, backendPost } from "@/features/auth/services/backend-api-client";
import type { WalletSummary, WalletTransaction, WalletTransactionType, WalletTransactionStatus } from "@/features/wallet/types/wallet";

export class InsufficientBalanceError extends Error {
  constructor() {
    super("Insufficient balance for this withdrawal.");
    this.name = "InsufficientBalanceError";
  }
}

export async function getWalletSummary(_userId?: string): Promise<WalletSummary> {
  const data = await backendGet("/users/dashboard");

  const availableBalance = Number(data?.wallet?.availableBalance) || 0;
  const totalDeposited = Number(data?.wallet?.totalDeposited) || 0;
  const totalWithdrawn = Number(data?.wallet?.totalWithdrawn) || 0;
  const todayDailyCommission = Number(data?.wallet?.todayDailyCommission) || 0;
  const totalTeamCommission = Number(data?.wallet?.totalTeamCommission) || 0;

  return {
    balanceCents: Math.round(availableBalance * 100),
    commissionUnlockAt: null,
    lastCommissionClaimedDate: null,
    lastReferralCommissionClaimedDate: null,
    totalCommissionCents: Math.round(todayDailyCommission * 100),
    totalDepositedCents: Math.round(totalDeposited * 100),
    totalReferralBonusCents: Math.round(totalTeamCommission * 100),
    totalWithdrawnCents: Math.round(totalWithdrawn * 100),
    transactions: [],
  };
}

export async function getGlobalDepositAddress() {
  return backendGet("/transactions/deposit/address");
}

export async function getTransactionHistory(_userId?: string): Promise<WalletTransaction[]> {
  const data = await backendGet("/transactions/history");

  return (data ?? []).map((tx: any) => ({
    id: tx._id,
    type: tx.type as WalletTransactionType,
    amountCents: Math.round((tx.amount ?? 0) * 100),
    status: tx.status as WalletTransactionStatus,
    balanceAfterCents: 0,
    createdAt: new Date(tx.createdAt),
    description: tx.description,
    sourceUserId: tx.sourceUserId,
    sourceUserName: tx.sourceUserName,
    depositAddress: tx.depositAddress,
    withdrawAddress: tx.walletAddress,
    withdrawNetwork: tx.network,
    screenshotUrl: tx.paymentScreenshotUrl,
    adminRemark: tx.adminRemark,
  }));
}

export async function depositToWallet(_userId?: string, amountCents?: number, depositAddress?: string, paymentScreenshotUrl?: string) {
  if (amountCents === undefined || !depositAddress) {
    throw new Error("Amount and deposit address are required.");
  }

  const data = await backendPost("/transactions/deposit", {
    amount: amountCents / 100,
    depositAddress,
    paymentScreenshotUrl,
  });

  return data.transactionId;
}

export async function withdrawFromWallet(_userId?: string, amountCents?: number, withdrawAddress?: string, network?: string) {
  if (amountCents === undefined || !withdrawAddress || !network) {
    throw new Error("Amount, withdraw address, and network are required.");
  }

  const data = await backendPost("/transactions/withdraw", {
    amount: amountCents / 100,
    withdrawAddress,
    network,
  });

  return data.transactionId;
}

export async function claimDailyCommission(_userId?: string) {
  return backendPost("/transactions/commission/claim", { type: "daily" });
}

export async function getReferralCommissionStatus(_userId?: string) {
  const data = await backendGet("/users/team");

  const teamDepositedCents = Math.round((data.stats?.teamDeposits ?? 0) * 100);
  const teamMemberCount = data.stats?.totalMembers ?? 0;
  const rate = 0.5;

  return {
    amountCents: Math.round(teamDepositedCents * rate / 100),
    teamDepositedCents,
    teamMemberCount,
    rate,
  };
}

export async function claimDailyReferralCommission(_userId?: string) {
  return backendPost("/transactions/commission/claim", { type: "referral" });
}
