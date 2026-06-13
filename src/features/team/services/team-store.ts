import type { Collection } from "mongodb";
import { getMongoDatabase } from "@/features/auth/services/mongodb-client";
import type { TeamMember, TeamSummary } from "@/features/team/types/team";

type TeamUserDocument = {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  referredByUserId: string | null;
  balanceCents?: number;
  totalDepositedCents?: number;
  totalWithdrawnCents?: number;
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

function toTeamMember(document: TeamUserDocument): TeamMember {
  return {
    balanceCents: document.balanceCents ?? 0,
    createdAt: document.createdAt,
    email: document.email,
    id: document.id,
    name: document.name,
    referralCode: document.referralCode,
    totalDepositedCents: document.totalDepositedCents ?? 0,
    totalWithdrawnCents: document.totalWithdrawnCents ?? 0,
  };
}

export async function getTeamSummary(userId: string): Promise<TeamSummary> {
  const usersCollection = await getUsersCollection();
  const members = (
    await usersCollection
      .find({ referredByUserId: userId })
      .sort({ createdAt: -1 })
      .toArray()
  ).map(toTeamMember);

  return {
    members,
    totalDepositedCents: members.reduce(
      (total, member) => total + member.totalDepositedCents,
      0,
    ),
    totalMembers: members.length,
    totalWithdrawnCents: members.reduce(
      (total, member) => total + member.totalWithdrawnCents,
      0,
    ),
  };
}
