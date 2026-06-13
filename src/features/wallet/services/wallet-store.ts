import { randomUUID } from "crypto";
import type { Collection, Document } from "mongodb";
import { getMongoDatabase } from "@/features/auth/services/mongodb-client";
import type {
  WalletSummary,
  WalletTransaction,
  WalletTransactionType,
} from "@/features/wallet/types/wallet";

type WalletUserDocument = {
  id: string;
  balanceCents?: number;
  totalDepositedCents?: number;
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
      totalDepositedCents: 0,
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

  return {
    balanceCents: document.balanceCents ?? 0,
    totalDepositedCents,
    totalWithdrawnCents,
    transactions,
  };
}

function createBalanceUpdatePipeline(
  type: WalletTransactionType,
  amountCents: number,
) {
  const now = new Date();
  const transactionId = randomUUID();
  const balanceExpression =
    type === "deposit"
      ? { $add: [{ $ifNull: ["$balanceCents", 0] }, amountCents] }
      : { $subtract: [{ $ifNull: ["$balanceCents", 0] }, amountCents] };
  const totalField =
    type === "deposit" ? "totalDepositedCents" : "totalWithdrawnCents";

  return [
    {
      $set: {
        balanceCents: balanceExpression,
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

export async function getWalletSummary(userId: string) {
  const usersCollection = await getUsersCollection();
  const user = await usersCollection.findOne({ id: userId });

  return toWalletSummary(user);
}

export async function depositToWallet(userId: string, amountCents: number) {
  const usersCollection = await getUsersCollection();

  await usersCollection.updateOne(
    { id: userId },
    createBalanceUpdatePipeline("deposit", amountCents),
  );
}

export async function withdrawFromWallet(userId: string, amountCents: number) {
  const usersCollection = await getUsersCollection();
  const result = await usersCollection.updateOne(
    { balanceCents: { $gte: amountCents }, id: userId },
    createBalanceUpdatePipeline("withdrawal", amountCents),
  );

  if (result.modifiedCount === 0) {
    throw new InsufficientBalanceError();
  }
}
