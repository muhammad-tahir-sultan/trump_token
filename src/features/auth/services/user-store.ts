import { randomBytes, randomUUID } from "crypto";
import { MongoServerError, type Collection } from "mongodb";
import type { SignupInput, StoredUser } from "@/features/auth/types/auth";
import { getMongoDatabase } from "@/features/auth/services/mongodb-client";
import { hashPassword } from "@/features/auth/services/password-service";

type UserDocument = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  referralCode: string;
  referredByUserId: string | null;
  role: "admin" | "user";
  balanceCents?: number;
  lastCommissionClaimedDate?: string | null;
  totalCommissionCents?: number;
  totalDepositedCents?: number;
  totalReferralBonusCents?: number;
  totalWithdrawnCents?: number;
  transactions?: unknown[];
  createdAt: Date;
  updatedAt: Date;
};

let usersCollectionPromise: Promise<Collection<UserDocument>> | null = null;

export class DuplicateUserEmailError extends Error {
  constructor() {
    super("An account already exists for this email.");
    this.name = "DuplicateUserEmailError";
  }
}

export class InvalidReferralCodeError extends Error {
  constructor() {
    super("Referral code is invalid.");
    this.name = "InvalidReferralCodeError";
  }
}

async function getUsersCollection() {
  if (!usersCollectionPromise) {
    usersCollectionPromise = getMongoDatabase().then(async (database) => {
      const collection = database.collection<UserDocument>("users");

      await collection.createIndex({ email: 1 }, { unique: true });
      await collection.createIndex({ referralCode: 1 }, { unique: true });
      await collection.createIndex({ referredByUserId: 1 });

      return collection;
    });
  }

  return usersCollectionPromise;
}

function toStoredUser(document: UserDocument): StoredUser {
  return {
    id: document.id,
    name: document.name,
    email: document.email,
    passwordHash: document.passwordHash,
    referralCode: document.referralCode,
    referredByUserId: document.referredByUserId,
    role: document.role,
  };
}

function createReferralCode() {
  return `RH-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function isDuplicateEmailError(error: MongoServerError) {
  return error.code === 11000 && "email" in (error.keyPattern ?? {});
}

function isDuplicateReferralCodeError(error: MongoServerError) {
  return error.code === 11000 && "referralCode" in (error.keyPattern ?? {});
}

export async function findUserByEmail(email: string) {
  const usersCollection = await getUsersCollection();
  const user = await usersCollection.findOne({ email });

  return user ? toStoredUser(user) : null;
}

export async function findUserByReferralCode(referralCode: string) {
  const usersCollection = await getUsersCollection();
  const user = await usersCollection.findOne({ referralCode });

  return user ? toStoredUser(user) : null;
}

export async function createUser(input: SignupInput) {
  const usersCollection = await getUsersCollection();
  const referrer = await findUserByReferralCode(input.referralCode);

  if (!referrer) {
    throw new InvalidReferralCodeError();
  }

  const now = new Date();
  const userDocument: UserDocument = {
    id: randomUUID(),
    name: input.name,
    email: input.email,
    passwordHash: hashPassword(input.password),
    referralCode: createReferralCode(),
    referredByUserId: referrer.id,
    role: "user",
    balanceCents: 0,
    lastCommissionClaimedDate: null,
    totalCommissionCents: 0,
    totalDepositedCents: 0,
    totalReferralBonusCents: 0,
    totalWithdrawnCents: 0,
    transactions: [],
    createdAt: now,
    updatedAt: now,
  };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const documentToInsert = {
      ...userDocument,
      referralCode: attempt === 0 ? userDocument.referralCode : createReferralCode(),
    };

    try {
      await usersCollection.insertOne(documentToInsert);

      return toStoredUser(documentToInsert);
    } catch (error) {
      if (error instanceof MongoServerError && isDuplicateEmailError(error)) {
        throw new DuplicateUserEmailError();
      }

      if (error instanceof MongoServerError && isDuplicateReferralCodeError(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Could not create a unique referral code. Please try again.");
}
