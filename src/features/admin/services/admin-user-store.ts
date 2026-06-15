import type { Collection } from "mongodb";
import { getMongoDatabase } from "@/features/auth/services/mongodb-client";
import { hashPassword } from "@/features/auth/services/password-service";

type AdminUserDocument = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  referralCode: string;
  referredByUserId: string | null;
  role: "admin" | "user";
  balanceCents?: number;
  totalDepositedCents?: number;
  totalWithdrawnCents?: number;
  createdAt: Date;
  updatedAt: Date;
};

let usersCollectionPromise: Promise<Collection<AdminUserDocument>> | null = null;

async function getUsersCollection() {
  if (!usersCollectionPromise) {
    usersCollectionPromise = getMongoDatabase().then((database) =>
      database.collection<AdminUserDocument>("users"),
    );
  }

  return usersCollectionPromise;
}

export type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  referralCode: string;
  balanceCents: number;
  totalDepositedCents: number;
  totalWithdrawnCents: number;
  referredByUserId: string | null;
  createdAt: string;
};

export type AdminUserDetail = AdminUserListItem & {
  hasPassword: boolean;
  passwordPreview: string;
};

function toListItem(document: AdminUserDocument): AdminUserListItem {
  return {
    id: document.id,
    name: document.name,
    email: document.email,
    role: document.role,
    referralCode: document.referralCode,
    balanceCents: document.balanceCents ?? 0,
    totalDepositedCents: document.totalDepositedCents ?? 0,
    totalWithdrawnCents: document.totalWithdrawnCents ?? 0,
    referredByUserId: document.referredByUserId,
    createdAt: document.createdAt.toISOString(),
  };
}

export async function getAllUsersForAdmin() {
  const usersCollection = await getUsersCollection();
  const users = await usersCollection.find({}).sort({ createdAt: -1 }).toArray();

  return users.map(toListItem);
}

export async function adminGetUserById(userId: string) {
  const usersCollection = await getUsersCollection();
  const user = await usersCollection.findOne({ id: userId });

  if (!user) return null;

  return {
    ...toListItem(user),
    hasPassword: Boolean(user.passwordHash),
    passwordPreview: user.passwordHash ? "•••••••• (encrypted)" : "Not set",
  } satisfies AdminUserDetail;
}

export async function adminUpdateUserBalance(userId: string, balanceCents: number) {
  const usersCollection = await getUsersCollection();

  await usersCollection.updateOne(
    { id: userId },
    { $set: { balanceCents, updatedAt: new Date() } },
  );
}

export async function adminUpdateUser(
  userId: string,
  data: { name?: string; email?: string; role?: "admin" | "user" },
) {
  const usersCollection = await getUsersCollection();
  const update: Partial<AdminUserDocument> = { updatedAt: new Date() };

  if (data.name) update.name = data.name.trim();
  if (data.email) update.email = data.email.trim().toLowerCase();
  if (data.role) update.role = data.role;

  await usersCollection.updateOne({ id: userId }, { $set: update });
}

export async function adminResetUserPassword(userId: string, newPassword: string) {
  const usersCollection = await getUsersCollection();

  await usersCollection.updateOne(
    { id: userId },
    {
      $set: {
        passwordHash: hashPassword(newPassword),
        updatedAt: new Date(),
      },
    },
  );
}

export async function adminDeleteUser(userId: string, currentAdminId: string) {
  if (userId === currentAdminId) {
    throw new Error("You cannot delete your own admin account.");
  }

  const usersCollection = await getUsersCollection();
  const result = await usersCollection.deleteOne({ id: userId });

  if (result.deletedCount === 0) {
    throw new Error("User not found.");
  }
}
