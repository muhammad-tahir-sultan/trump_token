import { createHash, randomBytes, randomUUID } from "crypto";
import { readFileSync } from "fs";
import { MongoClient } from "mongodb";

const envFilePath = ".env.local";
const defaultAdminEmail = "admin@rewardhub.local";
const defaultAdminName = "Admin";

function loadLocalEnv() {
  const envFile = readFileSync(envFilePath, "utf8");

  for (const line of envFile.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex);
    const value = trimmedLine
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^"|"$/g, "");

    process.env[key] = value;
  }
}

function getMongoUri() {
  const uri = process.env.MONGODB_URI?.replace(/^MONGODB_URI=/, "");

  if (!uri) {
    throw new Error("MONGODB_URI is required in .env.local.");
  }

  return uri;
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const digest = createHash("sha256").update(`${salt}${password}`).digest("hex");

  return `${salt}:${digest}`;
}

function createReferralCode() {
  return `ADMIN-${randomBytes(3).toString("hex").toUpperCase()}`;
}

loadLocalEnv();

const adminEmail = process.env.ADMIN_EMAIL ?? defaultAdminEmail;
const adminName = process.env.ADMIN_NAME ?? defaultAdminName;
const adminPassword =
  process.env.ADMIN_PASSWORD ?? `${randomBytes(9).toString("base64url")}A1!`;
const client = new MongoClient(getMongoUri());

try {
  await client.connect();

  const database = process.env.MONGODB_DB ? client.db(process.env.MONGODB_DB) : client.db();
  const users = database.collection("users");
  const now = new Date();
  const existingAdmin = await users.findOne({ email: adminEmail });
  const referralCode = existingAdmin?.referralCode ?? createReferralCode();

  await users.createIndex({ email: 1 }, { unique: true });
  await users.createIndex({ referralCode: 1 }, { unique: true });
  await users.createIndex({ referredByUserId: 1 });

  await users.updateOne(
    { email: adminEmail },
    {
      $set: {
        name: adminName,
        passwordHash: hashPassword(adminPassword),
        referralCode,
        referredByUserId: null,
        role: "admin",
        updatedAt: now,
      },
      $setOnInsert: {
        id: randomUUID(),
        email: adminEmail,
        createdAt: now,
      },
    },
    { upsert: true },
  );

  console.log("Admin user is ready.");
  console.log(`Email: ${adminEmail}`);
  console.log(`Password: ${adminPassword}`);
  console.log(`Referral Code: ${referralCode}`);
} finally {
  await client.close();
}
