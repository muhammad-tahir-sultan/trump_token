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
  email?: string;
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

type SettingsDocument = {
  key: string;
  address: string;
  network: string;
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

export async function depositToWallet(
  userId: string,
  amountCents: number,
  depositAddress?: string,
): Promise<string | undefined> {
  if (depositAddress) {
    return createPendingDeposit(userId, amountCents, depositAddress);
  }

  const usersCollection = await getUsersCollection();
  const user = await usersCollection.findOne(
    { id: userId },
    { projection: { name: 1, referredByUserId: 1 } },
  );

  await usersCollection.updateOne(
    { id: userId },
    createCreditUpdatePipeline("deposit", amountCents, "totalDepositedCents"),
  );

  await applyReferralBonus(usersCollection, user, userId, amountCents);
  return undefined;
}

async function createPendingDeposit(
  userId: string,
  amountCents: number,
  depositAddress: string,
) {
  const usersCollection = await getUsersCollection();
  const now = new Date();
  const transactionId = randomUUID();
  const user = await usersCollection.findOne({ id: userId });
  const balanceCents = user?.balanceCents ?? 0;

  const transaction: WalletTransaction = {
    amountCents,
    balanceAfterCents: balanceCents,
    createdAt: now,
    depositAddress,
    id: transactionId,
    status: "pending",
    type: "deposit",
  };

  await usersCollection.updateOne(
    { id: userId },
    {
      $set: { updatedAt: now },
      $push: {
        transactions: {
          $each: [transaction],
          $position: 0,
        },
      },
    },
  );

  return transactionId;
}

async function applyReferralBonus(
  usersCollection: Collection<WalletUserDocument>,
  user: Pick<WalletUserDocument, "name" | "referredByUserId"> | null,
  userId: string,
  amountCents: number,
) {
  if (!user?.referredByUserId) return;

  const bonusCents = Math.floor(amountCents * 0.01);
  if (bonusCents <= 0) return;

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

export async function withdrawFromWallet(
  userId: string,
  amountCents: number,
  withdrawAddress?: string,
  withdrawNetwork?: string,
) {
  if (withdrawAddress && withdrawNetwork) {
    return createPendingWithdrawal(
      userId,
      amountCents,
      withdrawAddress,
      withdrawNetwork,
    );
  }

  const usersCollection = await getUsersCollection();
  const result = await usersCollection.updateOne(
    { balanceCents: { $gte: amountCents }, id: userId },
    createWithdrawalUpdatePipeline(amountCents),
  );

  if (result.modifiedCount === 0) {
    throw new InsufficientBalanceError();
  }
}

async function createPendingWithdrawal(
  userId: string,
  amountCents: number,
  withdrawAddress: string,
  withdrawNetwork: string,
) {
  const usersCollection = await getUsersCollection();
  const user = await usersCollection.findOne({ id: userId });
  const balanceCents = user?.balanceCents ?? 0;

  if (balanceCents < amountCents) {
    throw new InsufficientBalanceError();
  }

  const now = new Date();
  const transactionId = randomUUID();
  const transaction: WalletTransaction = {
    amountCents,
    balanceAfterCents: balanceCents,
    createdAt: now,
    id: transactionId,
    status: "pending",
    type: "withdrawal",
    withdrawAddress,
    withdrawNetwork,
  };

  await usersCollection.updateOne(
    { id: userId },
    {
      $set: { updatedAt: now },
      $push: {
        transactions: {
          $each: [transaction],
          $position: 0,
        },
      },
    },
  );
}

export async function updateTransactionScreenshot(
  userId: string,
  transactionId: string,
  screenshotUrl: string,
) {
  const usersCollection = await getUsersCollection();

  await usersCollection.updateOne(
    { id: userId, "transactions.id": transactionId },
    {
      $set: {
        "transactions.$.screenshotUrl": screenshotUrl,
        updatedAt: new Date(),
      },
    },
  );
}

export async function getAllTransactions() {
  const usersCollection = await getUsersCollection();
  const users = await usersCollection
    .find({}, { projection: { id: 1, name: 1, email: 1, transactions: 1 } })
    .toArray();

  return users.flatMap((user) =>
    (user.transactions ?? []).map((transaction) => ({
      ...transaction,
      createdAt:
        transaction.createdAt instanceof Date
          ? transaction.createdAt.toISOString()
          : transaction.createdAt,
      userEmail: user.email ?? "",
      userId: user.id,
      userName: user.name ?? "Unknown",
    })),
  );
}

export async function approveTransaction(userId: string, transactionId: string) {
  const usersCollection = await getUsersCollection();
  const user = await usersCollection.findOne({ id: userId });

  if (!user) throw new Error("User not found.");

  const transaction = user.transactions?.find((item) => item.id === transactionId);
  if (!transaction || transaction.status !== "pending") {
    throw new Error("Pending transaction not found.");
  }

  if (transaction.type === "deposit") {
    const newBalance = (user.balanceCents ?? 0) + transaction.amountCents;

    await usersCollection.updateOne(
      { id: userId },
      {
        $inc: {
          balanceCents: transaction.amountCents,
          totalDepositedCents: transaction.amountCents,
        },
        $set: { updatedAt: new Date() },
      },
    );

    await usersCollection.updateOne(
      { id: userId, "transactions.id": transactionId },
      {
        $set: {
          "transactions.$.balanceAfterCents": newBalance,
          "transactions.$.status": "completed",
        },
      },
    );

    await applyReferralBonus(usersCollection, user, userId, transaction.amountCents);
    return;
  }

  if (transaction.type === "withdrawal") {
    const newBalance = (user.balanceCents ?? 0) - transaction.amountCents;
    const result = await usersCollection.updateOne(
      { balanceCents: { $gte: transaction.amountCents }, id: userId },
      {
        $inc: {
          balanceCents: -transaction.amountCents,
          totalWithdrawnCents: transaction.amountCents,
        },
        $set: { updatedAt: new Date() },
      },
    );

    if (result.modifiedCount === 0) {
      throw new InsufficientBalanceError();
    }

    await usersCollection.updateOne(
      { id: userId, "transactions.id": transactionId },
      {
        $set: {
          "transactions.$.balanceAfterCents": newBalance,
          "transactions.$.status": "completed",
        },
      },
    );
  }
}

export async function rejectTransaction(
  userId: string,
  transactionId: string,
  remark?: string,
) {
  const usersCollection = await getUsersCollection();

  await usersCollection.updateOne(
    { id: userId, "transactions.id": transactionId, "transactions.status": "pending" },
    {
      $set: {
        "transactions.$.adminRemark": remark ?? "Rejected by admin",
        "transactions.$.status": "rejected",
        updatedAt: new Date(),
      },
    },
  );
}

export async function getGlobalDepositAddress() {
  const database = await getMongoDatabase();
  const settings = database.collection<SettingsDocument>("settings");
  const config = await settings.findOne({ key: "deposit_address" });

  return {
    address: config?.address ?? "",
    network: config?.network ?? "TRON (TRC-20)",
  };
}

export async function setGlobalDepositAddress(address: string, network: string) {
  const database = await getMongoDatabase();
  const settings = database.collection<SettingsDocument>("settings");

  await settings.updateOne(
    { key: "deposit_address" },
    {
      $set: {
        address,
        key: "deposit_address",
        network,
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );
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
