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
const configuredAdminPassword = process.env.ADMIN_PASSWORD?.trim() || null;
const client = new MongoClient(getMongoUri());

try {
  await client.connect();

  const database = process.env.MONGODB_DB ? client.db(process.env.MONGODB_DB) : client.db();
  const users = database.collection("users");
  const now = new Date();
  const existingAdmin = await users.findOne({ email: adminEmail });
  const referralCode = existingAdmin?.referralCode ?? createReferralCode();
  const adminPassword =
    configuredAdminPassword ??
    (existingAdmin ? null : `${randomBytes(9).toString("base64url")}A1!`);

  await users.createIndex({ email: 1 }, { unique: true });
  await users.createIndex({ referralCode: 1 }, { unique: true });
  await users.createIndex({ referredByUserId: 1 });

  const adminUpdate = {
    name: adminName,
    referralCode,
    referredByUserId: null,
    role: "admin",
    updatedAt: now,
  };

  if (adminPassword) {
    adminUpdate.passwordHash = hashPassword(adminPassword);
  }

  await users.updateOne(
    { email: adminEmail },
    {
      $set: adminUpdate,
      $setOnInsert: {
        id: randomUUID(),
        email: adminEmail,
        balanceCents: 0,
        lastCommissionClaimedDate: null,
        totalCommissionCents: 0,
        totalDepositedCents: 0,
        totalReferralBonusCents: 0,
        totalWithdrawnCents: 0,
        transactions: [],
        createdAt: now,
      },
    },
    { upsert: true },
  );

  const adminRecord = await users.findOne({ email: adminEmail });

  console.log("Admin user is ready.");
  console.log(`Email: ${adminEmail}`);
  if (adminPassword) {
    console.log(`Password: ${adminPassword}`);
    console.log("Password source: ADMIN_PASSWORD env or first-time generated password.");
  } else {
    console.log("Password: unchanged (existing admin password kept).");
    console.log("Set ADMIN_PASSWORD in .env.local and re-run seed:admin to reset it.");
  }
  console.log(`Referral Code: ${adminRecord?.referralCode ?? referralCode}`);
} finally {
  await client.close();
}
