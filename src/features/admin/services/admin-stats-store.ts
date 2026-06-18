import type { Collection } from "mongodb";
import { getTodayKey } from "@/features/commission/services/commission-service";
import {
  getTransactionDayKey,
  isReferralTeamTransaction,
} from "@/features/team/services/team-stats-utils";
import { getMongoDatabase } from "@/features/auth/services/mongodb-client";
import type { WalletTransaction } from "@/features/wallet/types/wallet";

type StatsUserDocument = {
  id: string;
  role?: "admin" | "user";
  balanceCents?: number;
  totalDepositedCents?: number;
  totalWithdrawnCents?: number;
  totalCommissionCents?: number;
  totalReferralBonusCents?: number;
  transactions?: WalletTransaction[];
};

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

let usersCollectionPromise: Promise<Collection<StatsUserDocument>> | null = null;

async function getUsersCollection() {
  if (!usersCollectionPromise) {
    usersCollectionPromise = getMongoDatabase().then((database) =>
      database.collection<StatsUserDocument>("users"),
    );
  }

  return usersCollectionPromise;
}

function sumTodayCompletedTransactions(
  transactions: WalletTransaction[] | undefined,
  type: WalletTransaction["type"],
  todayKey: string,
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

function countPendingTransactions(
  transactions: WalletTransaction[] | undefined,
  type: WalletTransaction["type"],
) {
  return (transactions ?? []).filter(
    (transaction) => transaction.type === type && transaction.status === "pending",
  );
}

export async function getAdminPlatformStats(): Promise<AdminPlatformStats> {
  const usersCollection = await getUsersCollection();
  const users = await usersCollection
    .find(
      {},
      {
        projection: {
          balanceCents: 1,
          role: 1,
          totalCommissionCents: 1,
          totalDepositedCents: 1,
          totalReferralBonusCents: 1,
          totalWithdrawnCents: 1,
          transactions: 1,
        },
      },
    )
    .toArray();

  const todayKey = getTodayKey();

  let totalUsersCount = 0;
  let totalAdminsCount = 0;
  let totalDepositedCents = 0;
  let totalWithdrawnCents = 0;
  let totalBalanceCents = 0;
  let totalCommissionCents = 0;
  let totalReferralBonusCents = 0;
  let todayDepositedCents = 0;
  let todayWithdrawnCents = 0;
  let todayCommissionCents = 0;
  let todayReferralBonusCents = 0;
  let pendingDepositsCount = 0;
  let pendingWithdrawalsCount = 0;
  let pendingDepositsCents = 0;
  let pendingWithdrawalsCents = 0;

  for (const user of users) {
    if (user.role === "admin") {
      totalAdminsCount += 1;
    } else {
      totalUsersCount += 1;
    }

    totalDepositedCents += user.totalDepositedCents ?? 0;
    totalWithdrawnCents += user.totalWithdrawnCents ?? 0;
    totalBalanceCents += user.balanceCents ?? 0;
    totalCommissionCents += user.totalCommissionCents ?? 0;
    totalReferralBonusCents += user.totalReferralBonusCents ?? 0;

    todayDepositedCents += sumTodayCompletedTransactions(
      user.transactions,
      "deposit",
      todayKey,
    );
    todayWithdrawnCents += sumTodayCompletedTransactions(
      user.transactions,
      "withdrawal",
      todayKey,
    );
    todayCommissionCents += sumTodayCompletedTransactions(
      user.transactions,
      "daily_commission",
      todayKey,
    );

    for (const transaction of user.transactions ?? []) {
      if (
        transaction.status === "completed" &&
        isReferralTeamTransaction(transaction.type) &&
        getTransactionDayKey(transaction.createdAt) === todayKey
      ) {
        todayReferralBonusCents += transaction.amountCents;
      }
    }

    const pendingDeposits = countPendingTransactions(user.transactions, "deposit");
    const pendingWithdrawals = countPendingTransactions(
      user.transactions,
      "withdrawal",
    );

    pendingDepositsCount += pendingDeposits.length;
    pendingWithdrawalsCount += pendingWithdrawals.length;
    pendingDepositsCents += pendingDeposits.reduce(
      (total, transaction) => total + transaction.amountCents,
      0,
    );
    pendingWithdrawalsCents += pendingWithdrawals.reduce(
      (total, transaction) => total + transaction.amountCents,
      0,
    );
  }

  return {
    totalUsersCount,
    totalAdminsCount,
    totalDepositedCents,
    totalWithdrawnCents,
    totalBalanceCents,
    totalCommissionCents,
    totalReferralBonusCents,
    todayDepositedCents,
    todayWithdrawnCents,
    todayCommissionCents,
    todayReferralBonusCents,
    pendingDepositsCount,
    pendingWithdrawalsCount,
    pendingDepositsCents,
    pendingWithdrawalsCents,
  };
}
