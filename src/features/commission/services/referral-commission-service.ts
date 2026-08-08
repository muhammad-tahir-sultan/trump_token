import type { WalletTransaction } from "@/features/wallet/types/wallet";
import { getTodayKey } from "@/features/commission/services/commission-service";
import {
  getTransactionDayKey,
  isReferralTeamTransaction,
} from "@/features/team/services/team-stats-utils";

export const REFERRAL_DAILY_RATE = 0.5;
export const COMMISSION_LOCK_MS = 24 * 60 * 60 * 1000;

export type ReferralCommissionPreview = {
  amountCents: number;
  rate: number;
  teamDepositedCents: number;
  teamMemberCount: number;
};

export function getReferralCommissionPreview(teamDepositedCents: number, teamMemberCount: number) {
  if (teamMemberCount === 0 || teamDepositedCents <= 0) {
    return {
      amountCents: 0,
      rate: REFERRAL_DAILY_RATE,
      teamDepositedCents: 0,
      teamMemberCount: 0,
    };
  }

  return {
    amountCents: Math.floor((teamDepositedCents * REFERRAL_DAILY_RATE) / 100),
    rate: REFERRAL_DAILY_RATE,
    teamDepositedCents,
    teamMemberCount,
  };
}

export function getCommissionUnlockRemainingMs(unlockAt: Date | string | null | undefined, now = Date.now()) {
  if (!unlockAt) return 0;

  const unlockTime = unlockAt instanceof Date ? unlockAt.getTime() : new Date(unlockAt).getTime();
  return Math.max(0, unlockTime - now);
}

export function formatRemainingDuration(remainingMs: number) {
  if (remainingMs <= 0) return "";

  const totalMinutes = Math.ceil(remainingMs / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
}

export function getTodayTeamCommissionCents(transactions: WalletTransaction[]) {
  const todayKey = getTodayKey();

  return transactions
    .filter((transaction) => {
      if (transaction.status !== "completed") return false;
      if (!isReferralTeamTransaction(transaction.type)) return false;

      return getTransactionDayKey(transaction.createdAt) === todayKey;
    })
    .reduce((total, transaction) => total + transaction.amountCents, 0);
}
