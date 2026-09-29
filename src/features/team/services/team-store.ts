import type { Collection } from "mongodb";
import { getMongoDatabase } from "@/features/auth/services/mongodb-client";
import type { TeamMember, TeamSummary } from "@/features/team/types/team";
import {
  sumTodayCompletedByType,
  sumTodayReferralCommission,
} from "@/features/team/services/team-stats-utils";
import type { WalletTransaction } from "@/features/wallet/types/wallet";

type TeamUserDocument = {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  referredByUserId: string | null;
  balanceCents?: number;
  totalDepositedCents?: number;
  totalReferralBonusCents?: number;
  totalWithdrawnCents?: number;
  transactions?: WalletTransaction[];
  createdAt: Date;
};

let usersCollectionPromise: Promise<Collection<TeamUserDocument>> | null = null;

async function getUsersCollection() {
  if (!usersCollectionPromise) {
    usersCollectionPromise = getMongoDatabase().then(async (database) => {
      const collection = database.collection<TeamUserDocument>("users");

      await collection.createIndex({ referredByUserId: 1 });

      return collection;
    });
  }

  return usersCollectionPromise;
}

function toTeamMember(document: any): TeamMember {
  const balanceCents =
    document.balanceCents ?? Math.round((Number(document.balance) || 0) * 100);
  const totalDepositedCents =
    document.totalDepositedCents ??
    Math.round((Number(document.totalDeposited) || 0) * 100);
  const totalWithdrawnCents =
    document.totalWithdrawnCents ??
    Math.round((Number(document.totalWithdrawn) || 0) * 100);

  return {
    balanceCents,
    createdAt: document.createdAt ? new Date(document.createdAt) : new Date(),
    email: document.email || "",
    id: document._id?.toString() || document.id || "",
    name: document.fullName || document.name || "Member",
    referralCode: document.referralCode || "",
    totalDepositedCents,
    totalWithdrawnCents,
  };
}

export async function getTeamSummary(userId: string): Promise<TeamSummary> {
  const usersCollection = await getUsersCollection();
  const { ObjectId } = await import("mongodb");
  const userQuery = ObjectId.isValid(userId)
    ? { $or: [{ _id: new ObjectId(userId) as any }, { id: userId }] }
    : { id: userId };

  const referrer = await usersCollection.findOne(userQuery as any, {
    projection: {
      referralCode: 1,
      totalReferralBonusCents: 1,
      transactions: 1,
    },
  });

  const referralCode = (referrer as any)?.referralCode;
  const memberQuery: any = {
    $or: [
      { referredByUserId: userId },
      ...(referralCode
        ? [
            { referredBy: referralCode },
            { referredBy: { $regex: new RegExp(`^${referralCode}$`, "i") } },
          ]
        : []),
      { referredBy: userId },
    ],
  };

  const memberDocuments = await usersCollection
    .find(memberQuery)
    .sort({ createdAt: -1 })
    .toArray();

  const members = memberDocuments.map(toTeamMember);

  let todayDepositedCents = 0;
  let todayWithdrawnCents = 0;

  for (const member of memberDocuments) {
    todayDepositedCents += sumTodayCompletedByType(member.transactions, "deposit");
    todayWithdrawnCents += sumTodayCompletedByType(member.transactions, "withdrawal");
  }

  return {
    members,
    totalBalanceCents: members.reduce(
      (total, member) => total + member.balanceCents,
      0,
    ),
    totalDepositedCents: members.reduce(
      (total, member) => total + member.totalDepositedCents,
      0,
    ),
    totalMembers: members.length,
    totalWithdrawnCents: members.reduce(
      (total, member) => total + member.totalWithdrawnCents,
      0,
    ),
    todayDepositedCents,
    todayWithdrawnCents,
    todayTeamCommissionCents: sumTodayReferralCommission(referrer?.transactions),
    totalTeamCommissionCents: referrer?.totalReferralBonusCents ?? 0,
  };
}
