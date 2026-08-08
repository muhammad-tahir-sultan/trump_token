import { ObjectId, type Collection } from "mongodb";
import { getMongoDatabase } from "@/features/auth/services/mongodb-client";
import { hashPassword } from "@/features/auth/services/password-service";

type AdminUserDocument = {
  id?: string;
  _id?: unknown;
  name?: string;
  fullName?: string;
  email: string;
  passwordHash: string;
  referralCode: string;
  referredByUserId?: string | null;
  referredBy?: string;
  role: "admin" | "user";
  balanceCents?: number;
  balance?: number;
  totalDepositedCents?: number;
  totalDeposited?: number;
  totalWithdrawnCents?: number;
  totalWithdrawn?: number;
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

function toObjectId(value: string) {
  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
}

function buildUserFilter(userId: string) {
  const filters: Record<string, unknown>[] = [{ id: userId }];
  const objectId = toObjectId(userId);
  if (objectId) {
    filters.push({ _id: objectId });
  }
  return { $or: filters };
}

function resolveId(document: AdminUserDocument): string {
  return document.id ?? (typeof document._id === "string" ? document._id : document._id?.toString() ?? "");
}

function toListItem(document: AdminUserDocument): AdminUserListItem {
  const createdAt = document.createdAt instanceof Date ? document.createdAt : new Date(document.createdAt ?? Date.now());
  const balanceCents = document.balanceCents ?? Math.round((document.balance ?? 0) * 100);
  const totalDepositedCents = document.totalDepositedCents ?? Math.round((document.totalDeposited ?? 0) * 100);
  const totalWithdrawnCents = document.totalWithdrawnCents ?? Math.round((document.totalWithdrawn ?? 0) * 100);

  return {
    id: resolveId(document),
    name: document.fullName ?? document.name ?? "",
    email: document.email,
    role: document.role,
    referralCode: document.referralCode,
    balanceCents,
    totalDepositedCents,
    totalWithdrawnCents,
    referredByUserId: document.referredByUserId ?? document.referredBy ?? null,
    createdAt: createdAt.toISOString(),
  };
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

export async function getAllUsersForAdmin() {
  const usersCollection = await getUsersCollection();
  const users = await usersCollection.find({}).sort({ createdAt: -1 }).toArray();

  return users.map(toListItem);
}

export async function adminGetUserById(userId: string) {
  const usersCollection = await getUsersCollection();
  const user = await usersCollection.findOne(buildUserFilter(userId));

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
    buildUserFilter(userId),
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

  await usersCollection.updateOne(buildUserFilter(userId), { $set: update });
}

export async function adminResetUserPassword(userId: string, newPassword: string) {
  const usersCollection = await getUsersCollection();

  await usersCollection.updateOne(
    buildUserFilter(userId),
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
  const result = await usersCollection.deleteOne(buildUserFilter(userId));

  if (result.deletedCount === 0) {
    throw new Error("User not found.");
  }
}
