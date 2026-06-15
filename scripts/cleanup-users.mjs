import { createHash, randomBytes, randomUUID } from "crypto";
import { readFileSync } from "fs";
import { MongoClient } from "mongodb";

const envFilePath = ".env.local";

function loadLocalEnv() {
  const envFile = readFileSync(envFilePath, "utf8");

  for (const line of envFile.split(/\r?\n/)) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) continue;

    const separatorIndex = trimmedLine.indexOf("=");
    if (separatorIndex === -1) continue;

    process.env[trimmedLine.slice(0, separatorIndex)] = trimmedLine
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^"|"$/g, "");
  }
}

function getMongoUri() {
  const uri = process.env.MONGODB_URI?.replace(/^MONGODB_URI=/, "");
  if (!uri) throw new Error("MONGODB_URI is required in .env.local.");
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

const adminEmail = process.env.ADMIN_EMAIL ?? "admin@rivochain.com";
const adminName = process.env.ADMIN_NAME ?? "Admin";
const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";

const client = new MongoClient(getMongoUri());

try {
  await client.connect();
  const database = process.env.MONGODB_DB ? client.db(process.env.MONGODB_DB) : client.db();
  const users = database.collection("users");
  const now = new Date();

  const deleteAll = await users.deleteMany({});
  console.log(`Removed ${deleteAll.deletedCount} user(s) from database.`);

  const referralCode = createReferralCode();

  await users.updateOne(
    { email: adminEmail },
    {
      $set: {
        name: adminName,
        referralCode,
        referredByUserId: null,
        role: "admin",
        passwordHash: hashPassword(adminPassword),
        updatedAt: now,
      },
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

  const admin = await users.findOne({ email: adminEmail });

  console.log("");
  console.log("Admin restored:");
  console.log(`Email: ${adminEmail}`);
  console.log(`Password: ${adminPassword}`);
  console.log(`Referral Code: ${admin?.referralCode ?? referralCode}`);

  const remaining = await users.find({}, { projection: { email: 1, role: 1 } }).toArray();
  console.log("");
  console.log("Remaining users:");
  for (const user of remaining) {
    console.log(`- ${user.email} | role: ${user.role ?? "user"}`);
  }
} finally {
  await client.close();
}
