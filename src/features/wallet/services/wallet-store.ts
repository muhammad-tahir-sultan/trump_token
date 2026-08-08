import { randomUUID } from "crypto";
import type { Collection, Document } from "mongodb";
import { getMongoDatabase } from "@/features/auth/services/mongodb-client";
import {
  getCommissionPreview,
  getEligibleLevel,
  getTodayKey,
} from "@/features/commission/services/commission-service";
import {
  COMMISSION_LOCK_MS,
  getReferralCommissionPreview,
} from "@/features/commission/services/referral-commission-service";
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
  commissionUnlockAt?: Date | null;
  lastCommissionClaimedDate?: string | null;
  lastReferralCommissionClaimedDate?: string | null;
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

export class CommissionLockedError extends Error {
  constructor(unlockAt: Date) {
    super(
      `Daily commission unlocks 24 hours after your latest approved deposit (${unlockAt.toLocaleString()}).`,
    );
    this.name = "CommissionLockedError";
  }
}

export class ReferralCommissionAlreadyClaimedError extends Error {
  constructor() {
    super("Referral commission has already been claimed today.");
    this.name = "ReferralCommissionAlreadyClaimedError";
  }
}

export class ReferralCommissionNotAvailableError extends Error {
  constructor() {
    super("No referral commission is available from your team balance.");
    this.name = "ReferralCommissionNotAvailableError";
  }
}

async function getUsersCollection() {
  if (!usersCollectionPromise) {
    usersCollectionPromise = getMongoDatabase().then(async (database) => {
      const collection = database.collection<WalletUserDocument>("users");

      await collection.createIndex(
        { id: 1 },
        {
          partialFilterExpression: { id: { $type: "string" } },
          unique: true,
        },
      );

      return collection;
    });
  }

  return usersCollectionPromise;
}

function toWalletSummary(document: WalletUserDocument | null): WalletSummary {
  if (!document) {
    return {
      balanceCents: 0,
      commissionUnlockAt: null,
      lastCommissionClaimedDate: null,
      lastReferralCommissionClaimedDate: null,
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
      .filter(
        (transaction) =>
          transaction.type === "withdrawal" &&
          transaction.status === "completed",
      )
      .reduce((total, transaction) => total + transaction.amountCents, 0);
  const totalReferralBonusCents =
    document.totalReferralBonusCents ??
    transactions
      .filter(
        (transaction) =>
          transaction.type === "referral_bonus" ||
          transaction.type === "referral_first_day_commission" ||
          transaction.type === "referral_daily_commission",
      )
      .reduce((total, transaction) => total + transaction.amountCents, 0);
  const totalCommissionCents =
    document.totalCommissionCents ??
    transactions
      .filter((transaction) => transaction.type === "daily_commission")
      .reduce((total, transaction) => total + transaction.amountCents, 0);

  return {
    balanceCents: document.balanceCents ?? 0,
    commissionUnlockAt: document.commissionUnlockAt
      ? new Date(document.commissionUnlockAt).toISOString()
      : null,
    lastCommissionClaimedDate: document.lastCommissionClaimedDate ?? null,
    lastReferralCommissionClaimedDate:
      document.lastReferralCommissionClaimedDate ?? null,
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
    [
      ...createCreditUpdatePipeline("deposit", amountCents, "totalDepositedCents"),
      {
        $set: {
          commissionUnlockAt: new Date(Date.now() + COMMISSION_LOCK_MS),
        },
      },
    ],
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

  const eligibleLevel = getEligibleLevel(amountCents);
  if (!eligibleLevel) return;

  const firstDayCommissionCents = Math.floor(
    (amountCents * eligibleLevel.dailyCommissionRate) / 100,
  );
  if (firstDayCommissionCents <= 0) return;

  const todayKey = getTodayKey();

  await usersCollection.updateOne(
    { id: user.referredByUserId },
    [
      ...createCreditUpdatePipeline(
        "referral_first_day_commission",
        firstDayCommissionCents,
        "totalReferralBonusCents",
        {
          description: `${eligibleLevel.dailyCommissionRate}% first-day referral commission from team deposit (${eligibleLevel.name}).`,
          sourceUserId: userId,
          sourceUserName: user.name,
        },
      ),
      {
        $set: {
          // Enforce: daily (0.5%) referral commission starts from next day.
          lastReferralCommissionClaimedDate: todayKey,
        },
      },
    ],
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
  const now = new Date();
  const transactionId = randomUUID();

  const result = await usersCollection.updateOne(
    { balanceCents: { $gte: amountCents }, id: userId },
    [
      {
        $set: {
          balanceCents: {
            $subtract: [{ $ifNull: ["$balanceCents", 0] }, amountCents],
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
    ],
  );

  if (result.modifiedCount === 0) {
    throw new InsufficientBalanceError();
  }

  return transactionId;
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
        $set: {
          commissionUnlockAt: new Date(Date.now() + COMMISSION_LOCK_MS),
          updatedAt: new Date(),
        },
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
    await usersCollection.updateOne(
      { id: userId, "transactions.id": transactionId },
      {
        $inc: { totalWithdrawnCents: transaction.amountCents },
        $set: {
          "transactions.$.status": "completed",
          updatedAt: new Date(),
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
  const user = await usersCollection.findOne({ id: userId });

  if (!user) {
    throw new Error("User not found.");
  }

  const transaction = user.transactions?.find((item) => item.id === transactionId);
  if (!transaction || transaction.status !== "pending") {
    throw new Error("Pending transaction not found.");
  }

  if (transaction.type === "withdrawal") {
    const newBalance = (user.balanceCents ?? 0) + transaction.amountCents;

    await usersCollection.updateOne(
      { id: userId },
      {
        $inc: { balanceCents: transaction.amountCents },
        $set: { updatedAt: new Date() },
      },
    );

    await usersCollection.updateOne(
      { id: userId, "transactions.id": transactionId, "transactions.status": "pending" },
      {
        $set: {
          "transactions.$.adminRemark": remark ?? "Rejected by admin",
          "transactions.$.balanceAfterCents": newBalance,
          "transactions.$.status": "rejected",
          updatedAt: new Date(),
        },
      },
    );

    return;
  }

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
  const totalDepositedCents = user?.totalDepositedCents ?? 0;
  const preview = getCommissionPreview(totalDepositedCents);

  if (!user || preview.amountCents <= 0) {
    throw new CommissionNotAvailableError();
  }

  if (user.commissionUnlockAt && user.commissionUnlockAt.getTime() > Date.now()) {
    throw new CommissionLockedError(user.commissionUnlockAt);
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
          description: `${preview.rate}% daily commission on total deposited amount.`,
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

export async function getReferralCommissionStatus(userId: string) {
  const usersCollection = await getUsersCollection();
  const members = await usersCollection
    .find({ referredByUserId: userId }, { projection: { totalDepositedCents: 1 } })
    .toArray();
  const teamDepositedCents = members.reduce(
    (total, member) => total + (member.totalDepositedCents ?? 0),
    0,
  );

  return getReferralCommissionPreview(teamDepositedCents, members.length);
}

export async function claimDailyReferralCommission(userId: string) {
  const usersCollection = await getUsersCollection();
  const todayKey = getTodayKey();
  const user = await usersCollection.findOne({ id: userId });

  if (!user) {
    throw new ReferralCommissionNotAvailableError();
  }

  const preview = await getReferralCommissionStatus(userId);

  if (preview.amountCents <= 0) {
    throw new ReferralCommissionNotAvailableError();
  }

  if (user.lastReferralCommissionClaimedDate === todayKey) {
    throw new ReferralCommissionAlreadyClaimedError();
  }

  const result = await usersCollection.updateOne(
    {
      id: userId,
      lastReferralCommissionClaimedDate: { $ne: todayKey },
    },
    [
      ...createCreditUpdatePipeline(
        "referral_daily_commission",
        preview.amountCents,
        "totalReferralBonusCents",
        {
          description: `0.5% daily referral commission on team deposits (${preview.teamMemberCount} members).`,
        },
      ),
      {
        $set: {
          lastReferralCommissionClaimedDate: todayKey,
        },
      },
    ],
  );

  if (result.modifiedCount === 0) {
    throw new ReferralCommissionAlreadyClaimedError();
  }

  return preview.amountCents;
}
