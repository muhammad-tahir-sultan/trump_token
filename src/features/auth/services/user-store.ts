import { randomUUID } from "crypto";
import { MongoServerError, type Collection } from "mongodb";
import type { SignupInput, StoredUser } from "@/features/auth/types/auth";
import { getMongoDatabase } from "@/features/auth/services/mongodb-client";
import { hashPassword } from "@/features/auth/services/password-service";

type UserDocument = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
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

async function getUsersCollection() {
  if (!usersCollectionPromise) {
    usersCollectionPromise = getMongoDatabase().then(async (database) => {
      const collection = database.collection<UserDocument>("users");

      await collection.createIndex({ email: 1 }, { unique: true });

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
  };
}

export async function findUserByEmail(email: string) {
  const usersCollection = await getUsersCollection();
  const user = await usersCollection.findOne({ email });

  return user ? toStoredUser(user) : null;
}

export async function createUser(input: SignupInput) {
  const usersCollection = await getUsersCollection();
  const now = new Date();
  const userDocument: UserDocument = {
    id: randomUUID(),
    name: input.name,
    email: input.email,
    passwordHash: hashPassword(input.password),
    createdAt: now,
    updatedAt: now,
  };

  try {
    await usersCollection.insertOne(userDocument);
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      throw new DuplicateUserEmailError();
    }

    throw error;
  }

  return toStoredUser(userDocument);
}
