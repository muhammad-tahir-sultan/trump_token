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

export type DepositAddressDocument = {
  address: string;
  network: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

async function getDepositAddressCollection() {
  const database = await getMongoDatabase();
  return database.collection<DepositAddressDocument>("deposit_addresses");
}

export async function getGlobalDepositAddress() {
  const collection = await getDepositAddressCollection();
  const addressDoc = await collection.findOne({ isActive: true });
  if (!addressDoc) {
    return {
      address: "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb", // Fallback TRON address
      network: "TRON (TRC-20)",
    };
  }
  return {
    address: addressDoc.address,
    network: addressDoc.network,
  };
}

export async function setGlobalDepositAddress(address: string, network: string) {
  const collection = await getDepositAddressCollection();
  await collection.updateMany({}, { $set: { isActive: false } });
  await collection.insertOne({
    address,
    network,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function depositToWallet(userId: string, amountCents: number, depositAddress: string) {
  const usersCollection = await getUsersCollection();
  const now = new Date();
  const transactionId = randomUUID();

  const newTransaction: WalletTransaction = {
    id: transactionId,
    type: "deposit",
    amountCents,
    status: "pending",
    balanceAfterCents: 0,
    createdAt: now,
    depositAddress,
  };

  await usersCollection.updateOne(
    { id: userId },
    {
      $push: {
        transactions: {
          $each: [newTransaction],
          $position: 0
        }
      } as any,
      $set: { updatedAt: now }
    }
  );
  return transactionId;
}

function createWithdrawalPendingPipeline(
  amountCents: number,
  withdrawAddress: string,
  withdrawNetwork: string
) {
  const now = new Date();
  const transactionId = randomUUID();

  return [
    {
      $set: {
        balanceCents: { $subtract: [{ $ifNull: ["$balanceCents", 0] }, amountCents] },
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
                status: "pending",
                type: "withdrawal",
                withdrawAddress,
                withdrawNetwork,
              },
            ],
            { $ifNull: ["$transactions", []] },
          ],
        },
      },
    },
  ] satisfies Document[];
}

export async function withdrawFromWallet(
  userId: string,
  amountCents: number,
  withdrawAddress: string,
  withdrawNetwork: string
) {
  const usersCollection = await getUsersCollection();
  const result = await usersCollection.updateOne(
    { balanceCents: { $gte: amountCents }, id: userId },
    createWithdrawalPendingPipeline(amountCents, withdrawAddress, withdrawNetwork),
  );

  if (result.modifiedCount === 0) {
    throw new InsufficientBalanceError();
  }
}

export async function updateTransactionScreenshot(userId: string, transactionId: string, screenshotUrl: string) {
  const usersCollection = await getUsersCollection();
  const now = new Date();
  
  await usersCollection.updateOne(
    { id: userId, "transactions.id": transactionId },
    {
      $set: {
        "transactions.$.screenshotUrl": screenshotUrl,
        "transactions.$.updatedAt": now,
        updatedAt: now
      }
    }
  );
}

export async function approveTransaction(userId: string, transactionId: string) {
  const usersCollection = await getUsersCollection();
  const user = await usersCollection.findOne({ id: userId });
  if (!user) {
    throw new Error("User not found");
  }

  const transactions = user.transactions ?? [];
  const txIndex = transactions.findIndex(t => t.id === transactionId);
  if (txIndex === -1) {
    throw new Error("Transaction not found");
  }

  const tx = transactions[txIndex];
  if (tx.status !== "pending") {
    throw new Error("Transaction is already processed");
  }

  const now = new Date();
  
  if (tx.type === "deposit") {
    const amountCents = tx.amountCents;
    const newBalance = (user.balanceCents ?? 0) + amountCents;
    const newTotalDeposited = (user.totalDepositedCents ?? 0) + amountCents;

    await usersCollection.updateOne(
      { id: userId, "transactions.id": transactionId },
      {
        $set: {
          balanceCents: newBalance,
          totalDepositedCents: newTotalDeposited,
          "transactions.$.status": "completed",
          "transactions.$.balanceAfterCents": newBalance,
          "transactions.$.updatedAt": now,
          updatedAt: now
        }
      }
    );

    if (user.referredByUserId) {
      const bonusCents = Math.floor(amountCents * 0.01);
      if (bonusCents > 0) {
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
    }
  } else if (tx.type === "withdrawal") {
    const amountCents = tx.amountCents;
    const newTotalWithdrawn = (user.totalWithdrawnCents ?? 0) + amountCents;
    await usersCollection.updateOne(
      { id: userId, "transactions.id": transactionId },
      {
        $set: {
          totalWithdrawnCents: newTotalWithdrawn,
          "transactions.$.status": "completed",
          "transactions.$.updatedAt": now,
          updatedAt: now
        }
      }
    );
  }
}

export async function rejectTransaction(userId: string, transactionId: string, remark?: string) {
  const usersCollection = await getUsersCollection();
  const user = await usersCollection.findOne({ id: userId });
  if (!user) {
    throw new Error("User not found");
  }

  const transactions = user.transactions ?? [];
  const txIndex = transactions.findIndex(t => t.id === transactionId);
  if (txIndex === -1) {
    throw new Error("Transaction not found");
  }

  const tx = transactions[txIndex];
  if (tx.status !== "pending") {
    throw new Error("Transaction is already processed");
  }

  const now = new Date();

  if (tx.type === "deposit") {
    await usersCollection.updateOne(
      { id: userId, "transactions.id": transactionId },
      {
        $set: {
          "transactions.$.status": "rejected",
          "transactions.$.adminRemark": remark || "",
          "transactions.$.updatedAt": now,
          updatedAt: now
        }
      }
    );
  } else if (tx.type === "withdrawal") {
    const amountCents = tx.amountCents;
    const refundedBalance = (user.balanceCents ?? 0) + amountCents;

    await usersCollection.updateOne(
      { id: userId, "transactions.id": transactionId },
      {
        $set: {
          balanceCents: refundedBalance,
          "transactions.$.status": "rejected",
          "transactions.$.balanceAfterCents": refundedBalance,
          "transactions.$.adminRemark": remark || "",
          "transactions.$.updatedAt": now,
          updatedAt: now
        }
      }
    );
  }
}

export type AdminTransactionView = WalletTransaction & {
  userId: string;
  userName: string;
  userEmail: string;
};

export async function getAllTransactions(): Promise<AdminTransactionView[]> {
  const usersCollection = await getUsersCollection();
  const allUsers = await usersCollection.find({}).toArray();

  const allTxs: AdminTransactionView[] = [];
  for (const user of allUsers) {
    const txs = user.transactions ?? [];
    for (const tx of txs) {
      allTxs.push({
        ...tx,
        userId: user.id,
        userName: user.name || "Unknown",
        userEmail: user.email || "Unknown",
      });
    }
  }

  return allTxs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
