import { randomUUID } from "crypto";
import type { Collection, Document } from "mongodb";
import { getMongoDatabase } from "@/features/auth/services/mongodb-client";
import {
  getCommissionPreview,
  getTodayKey,
} from "@/features/commission/services/commission-service";
import type {
  WalletSummary,
  WalletTransaction,
  WalletTransactionType,
} from "@/features/wallet/types/wallet";

type WalletUserDocument = {
  id: string;
  name?: string;
  referredByUserId?: string | null;
  balanceCents?: number;
  lastCommissionClaimedDate?: string | null;
  totalCommissionCents?: number;
  totalDepositedCents?: number;
  totalReferralBonusCents?: number;
  totalWithdrawnCents?: number;
  transactions?: WalletTransaction[];
  updatedAt: Date;
};

let usersCollectionPromise: Promise<Collection<WalletUserDocument>> | null = null;

export class InsufficientBalanceError extends Error {
  constructor() {
    super("Insufficient balance for this withdrawal.");
    this.name = "InsufficientBalanceError";
  }
}

export class CommissionAlreadyClaimedError extends Error {
  constructor() {
    super("Daily commission has already been claimed today.");
    this.name = "CommissionAlreadyClaimedError";
  }
}

export class CommissionNotAvailableError extends Error {
  constructor() {
    super("Deposit at least $10.00 to unlock daily commission.");
    this.name = "CommissionNotAvailableError";
  }
}

async function getUsersCollection() {
  if (!usersCollectionPromise) {
    usersCollectionPromise = getMongoDatabase().then(async (database) => {
      const collection = database.collection<WalletUserDocument>("users");

      await collection.createIndex({ id: 1 }, { unique: true });

      return collection;
    });
  }

  return usersCollectionPromise;
}

function toWalletSummary(document: WalletUserDocument | null): WalletSummary {
  if (!document) {
    return {
      balanceCents: 0,
      lastCommissionClaimedDate: null,
      totalCommissionCents: 0,
      totalDepositedCents: 0,
      totalReferralBonusCents: 0,
      totalWithdrawnCents: 0,
      transactions: [],
    };
  }

  const transactions = document.transactions ?? [];
  const totalDepositedCents =
    document.totalDepositedCents ??
    transactions
      .filter((transaction) => transaction.type === "deposit")
      .reduce((total, transaction) => total + transaction.amountCents, 0);
  const totalWithdrawnCents =
    document.totalWithdrawnCents ??
    transactions
      .filter((transaction) => transaction.type === "withdrawal")
      .reduce((total, transaction) => total + transaction.amountCents, 0);
  const totalReferralBonusCents =
    document.totalReferralBonusCents ??
    transactions
      .filter((transaction) => transaction.type === "referral_bonus")
      .reduce((total, transaction) => total + transaction.amountCents, 0);
  const totalCommissionCents =
    document.totalCommissionCents ??
    transactions
      .filter((transaction) => transaction.type === "daily_commission")
      .reduce((total, transaction) => total + transaction.amountCents, 0);

  return {
    balanceCents: document.balanceCents ?? 0,
    lastCommissionClaimedDate: document.lastCommissionClaimedDate ?? null,
    totalCommissionCents,
    totalDepositedCents,
    totalReferralBonusCents,
    totalWithdrawnCents,
    transactions,
  };
}

type TransactionMetadata = Pick<
  WalletTransaction,
  "description" | "sourceUserId" | "sourceUserName"
>;

function createCreditUpdatePipeline(
  type: WalletTransactionType,
  amountCents: number,
  totalField: keyof Pick<
    WalletUserDocument,
    | "totalCommissionCents"
    | "totalDepositedCents"
    | "totalReferralBonusCents"
    | "totalWithdrawnCents"
  >,
  metadata: TransactionMetadata = {},
) {
  const now = new Date();
  const transactionId = randomUUID();

  return [
    {
      $set: {
        balanceCents: { $add: [{ $ifNull: ["$balanceCents", 0] }, amountCents] },
        [totalField]: { $add: [{ $ifNull: [`$${totalField}`, 0] }, amountCents] },
        updatedAt: now,
      },
    },
    {
      $set: {
        transactions: {
          $concatArrays: [
            [
              {
                ...metadata,
                amountCents,
                balanceAfterCents: "$balanceCents",
                createdAt: now,
                id: transactionId,
                status: "completed",
                type,
              },
            ],
            { $ifNull: ["$transactions", []] },
          ],
        },
      },
    },
  ] satisfies Document[];
}

function createWithdrawalUpdatePipeline(
  amountCents: number,
) {
  const now = new Date();
  const transactionId = randomUUID();

  return [
    {
      $set: {
        balanceCents: { $subtract: [{ $ifNull: ["$balanceCents", 0] }, amountCents] },
        totalWithdrawnCents: {
          $add: [{ $ifNull: ["$totalWithdrawnCents", 0] }, amountCents],
        },
        updatedAt: now,
      },
    },
    {
      $set: {
        transactions: {
          $concatArrays: [
            [
              {
                amountCents,
                balanceAfterCents: "$balanceCents",
                createdAt: now,
                id: transactionId,
                status: "completed",
                type: "withdrawal",
              },
            ],
            { $ifNull: ["$transactions", []] },
          ],
        },
      },
    },
  ] satisfies Document[];
}

export async function getWalletSummary(userId: string) {
  const usersCollection = await getUsersCollection();
  const user = await usersCollection.findOne({ id: userId });

  return toWalletSummary(user);
}

export async function depositToWallet(userId: string, amountCents: number) {
  const usersCollection = await getUsersCollection();
  const user = await usersCollection.findOne(
    { id: userId },
    { projection: { name: 1, referredByUserId: 1 } },
  );

  await usersCollection.updateOne(
    { id: userId },
    createCreditUpdatePipeline("deposit", amountCents, "totalDepositedCents"),
  );

  if (!user?.referredByUserId) {
    return;
  }

  const bonusCents = Math.floor(amountCents * 0.01);

  if (bonusCents <= 0) {
    return;
  }

  await usersCollection.updateOne(
    { id: user.referredByUserId },
    createCreditUpdatePipeline(
      "referral_bonus",
      bonusCents,
      "totalReferralBonusCents",
      {
        description: "1% referral bonus from team deposit.",
        sourceUserId: userId,
        sourceUserName: user.name,
      },
    ),
  );
}

export async function withdrawFromWallet(userId: string, amountCents: number) {
  const usersCollection = await getUsersCollection();
  const result = await usersCollection.updateOne(
    { balanceCents: { $gte: amountCents }, id: userId },
    createWithdrawalUpdatePipeline(amountCents),
  );

  if (result.modifiedCount === 0) {
    throw new InsufficientBalanceError();
  }
}

export async function claimDailyCommission(userId: string) {
  const usersCollection = await getUsersCollection();
  const todayKey = getTodayKey();
  const user = await usersCollection.findOne({ id: userId });
  const balanceCents = user?.balanceCents ?? 0;
  const preview = getCommissionPreview(balanceCents);

  if (!user || preview.amountCents <= 0) {
    throw new CommissionNotAvailableError();
  }

  if (user.lastCommissionClaimedDate === todayKey) {
    throw new CommissionAlreadyClaimedError();
  }

  const result = await usersCollection.updateOne(
    {
      id: userId,
      lastCommissionClaimedDate: { $ne: todayKey },
    },
    [
      ...createCreditUpdatePipeline(
        "daily_commission",
        preview.amountCents,
        "totalCommissionCents",
        {
          description: `${preview.rate}% daily commission on existing balance.`,
        },
      ),
      {
        $set: {
          lastCommissionClaimedDate: todayKey,
        },
      },
    ],
  );

  if (result.modifiedCount === 0) {
    throw new CommissionAlreadyClaimedError();
  }
}
