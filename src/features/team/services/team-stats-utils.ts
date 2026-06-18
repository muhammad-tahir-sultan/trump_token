import { getTodayKey } from "@/features/commission/services/commission-service";
import type { WalletTransaction, WalletTransactionType } from "@/features/wallet/types/wallet";

const referralTransactionTypes = new Set<WalletTransactionType>([
  "referral_bonus",
  "referral_first_day_commission",
  "referral_daily_commission",
]);

export function isReferralTeamTransaction(type: WalletTransactionType) {
  return referralTransactionTypes.has(type);
}

export function getTransactionDayKey(createdAt: Date | string | undefined) {
  if (!createdAt) return null;

  const date = createdAt instanceof Date ? createdAt : new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString().slice(0, 10);
}

export function sumTodayCompletedByType(
  transactions: WalletTransaction[] | undefined,
  type: WalletTransaction["type"],
  todayKey = getTodayKey(),
) {
  return (transactions ?? [])
    .filter(
      (transaction) =>
        transaction.type === type &&
        transaction.status === "completed" &&
        getTransactionDayKey(transaction.createdAt) === todayKey,
    )
    .reduce((total, transaction) => total + transaction.amountCents, 0);
}

export function sumTodayReferralCommission(
  transactions: WalletTransaction[] | undefined,
  todayKey = getTodayKey(),
) {
  return (transactions ?? [])
    .filter(
      (transaction) =>
        transaction.status === "completed" &&
        isReferralTeamTransaction(transaction.type) &&
        getTransactionDayKey(transaction.createdAt) === todayKey,
    )
    .reduce((total, transaction) => total + transaction.amountCents, 0);
}
