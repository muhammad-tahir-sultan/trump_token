import { randomUUID } from "crypto";
import type { Collection } from "mongodb";
import { getMongoDatabase } from "@/features/auth/services/mongodb-client";

export type CSRequestType = "COMBO_UNLOCK" | "WITHDRAWAL_HELP" | "DEPOSIT_HELP" | "OTHER";
export type CSRequestStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";

export type CSRequestDocument = {
  id: string;
  userId: string;
  userName: string;
  type: CSRequestType;
  message: string;
  screenshotUrl?: string;
  depositAmount?: number;
  status: CSRequestStatus;
  adminRemark?: string;
  createdAt: Date;
  updatedAt: Date;
};

let csCollectionPromise: Promise<Collection<CSRequestDocument>> | null = null;

async function getCSCollection() {
  if (!csCollectionPromise) {
    csCollectionPromise = getMongoDatabase().then(async (database) => {
      const collection = database.collection<CSRequestDocument>("cs_requests");
      await collection.createIndex({ userId: 1 });
      await collection.createIndex({ id: 1 }, { unique: true });
      return collection;
    });
  }
  return csCollectionPromise;
}

export async function createCSRequest(
  userId: string,
  userName: string,
  type: CSRequestType,
  message: string,
  screenshotUrl?: string,
  depositAmount?: number
) {
  const collection = await getCSCollection();
  const now = new Date();
  const requestId = randomUUID();

  // Guard: check if user has an existing OPEN or IN_PROGRESS request of the same type to throttle
  const existing = await collection.findOne({
    userId,
    type,
    status: { $in: ["OPEN", "IN_PROGRESS"] },
  });

  if (existing) {
    throw new Error(
      "Wait! We have received your previous request and will respond soon. ⏳"
    );
  }

  const newRequest: CSRequestDocument = {
    id: requestId,
    userId,
    userName,
    type,
    message,
    screenshotUrl,
    depositAmount,
    status: "OPEN",
    createdAt: now,
    updatedAt: now,
  };

  await collection.insertOne(newRequest);
  return newRequest;
}

export async function getCSRequests(userId?: string) {
  const collection = await getCSCollection();
  const query = userId ? { userId } : {};
  return await collection
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();
}

export async function updateCSRequestStatus(
  requestId: string,
  status: CSRequestStatus,
  adminRemark?: string
) {
  const collection = await getCSCollection();
  const now = new Date();

  const result = await collection.updateOne(
    { id: requestId },
    {
      $set: {
        status,
        adminRemark: adminRemark || "",
        updatedAt: now,
      },
    }
  );

  if (result.matchedCount === 0) {
    throw new Error("Support request not found");
  }
}
