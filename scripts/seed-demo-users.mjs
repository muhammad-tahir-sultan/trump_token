import { createHash, randomBytes, randomUUID } from "crypto";
import { readFileSync } from "fs";
import { MongoClient } from "mongodb";

const envFilePath = ".env.local";
const defaultAdminEmail = "admin@rewardhub.local";

const demoUsers = [
  {
    name: "Demo User One",
    email: "demo1@rewardhub.local",
    password: "DemoUser1!",
    depositCents: 100_00,
    withdrawalCents: 0,
  },
  {
    name: "Demo User Two",
    email: "demo2@rewardhub.local",
    password: "DemoUser2!",
    depositCents: 250_00,
    withdrawalCents: 50_00,
  },
  {
    name: "Demo User Three",
    email: "demo3@rewardhub.local",
    password: "DemoUser3!",
    depositCents: 50_00,
    withdrawalCents: 0,
  },
];

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
  return `RH-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function formatCurrency(cents) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(cents / 100);
}

function createCreditUpdatePipeline(type, amountCents, totalField, metadata = {}) {
  const now = new Date();
  const transactionId = randomUUID();

  return [
    {
      $set: {
        balanceCents: { $add: [{ $ifNull: ["$balanceCents", 0] }, amountCents] },
        [totalField]: { $add: [{ $ifNull: [`$${totalField}`, 0] }, amountCents] },
        updatedAt: now,
      },
    },
    {
      $set: {
        transactions: {
          $concatArrays: [
            [
              {
                ...metadata,
                amountCents,
                balanceAfterCents: "$balanceCents",
                createdAt: now,
                id: transactionId,
                status: "completed",
                type,
              },
            ],
            { $ifNull: ["$transactions", []] },
          ],
        },
      },
    },
  ];
}

function createWithdrawalUpdatePipeline(amountCents) {
  const now = new Date();
  const transactionId = randomUUID();

  return [
    {
      $set: {
        balanceCents: { $subtract: [{ $ifNull: ["$balanceCents", 0] }, amountCents] },
        totalWithdrawnCents: {
          $add: [{ $ifNull: ["$totalWithdrawnCents", 0] }, amountCents],
        },
        updatedAt: now,
      },
    },
    {
      $set: {
        transactions: {
          $concatArrays: [
            [
              {
                amountCents,
                balanceAfterCents: "$balanceCents",
                createdAt: now,
                id: transactionId,
                status: "completed",
                type: "withdrawal",
              },
            ],
            { $ifNull: ["$transactions", []] },
          ],
        },
      },
    },
  ];
}

async function depositToWallet(users, userId, amountCents) {
  const user = await users.findOne(
    { id: userId },
    { projection: { name: 1, referredByUserId: 1 } },
  );

  await users.updateOne(
    { id: userId },
    createCreditUpdatePipeline("deposit", amountCents, "totalDepositedCents"),
  );

  if (!user?.referredByUserId) {
    return 0;
  }

  const bonusCents = Math.floor(amountCents * 0.01);

  if (bonusCents <= 0) {
    return 0;
  }

  await users.updateOne(
    { id: user.referredByUserId },
    createCreditUpdatePipeline("referral_bonus", bonusCents, "totalReferralBonusCents", {
      description: "1% referral bonus from team deposit.",
      sourceUserId: userId,
      sourceUserName: user.name,
    }),
  );

  return bonusCents;
}

async function withdrawFromWallet(users, userId, amountCents) {
  const result = await users.updateOne(
    { balanceCents: { $gte: amountCents }, id: userId },
    createWithdrawalUpdatePipeline(amountCents),
  );

  if (result.modifiedCount === 0) {
    throw new Error(`Withdrawal failed for user ${userId}.`);
  }
}

loadLocalEnv();

const adminEmail = process.env.ADMIN_EMAIL ?? defaultAdminEmail;
const client = new MongoClient(getMongoUri());

try {
  await client.connect();

  const database = process.env.MONGODB_DB ? client.db(process.env.MONGODB_DB) : client.db();
  const users = database.collection("users");
  const now = new Date();
  const admin = await users.findOne({ email: adminEmail });

  if (!admin) {
    throw new Error(`Admin not found. Run "npm run seed:admin" first.`);
  }

  let totalBonusCents = 0;

  console.log("Seeding demo users under admin referral...");
  console.log(`Admin: ${admin.email}`);
  console.log(`Referral Code: ${admin.referralCode}`);
  console.log("");

  for (const demoUser of demoUsers) {
    const existingUser = await users.findOne({ email: demoUser.email });
    const userId = existingUser?.id ?? randomUUID();
    const referralCode = existingUser?.referralCode ?? createReferralCode();

    await users.updateOne(
      { email: demoUser.email },
      {
        $set: {
          name: demoUser.name,
          passwordHash: hashPassword(demoUser.password),
          referralCode,
          referredByUserId: admin.id,
          role: "user",
          balanceCents: 0,
          lastCommissionClaimedDate: null,
          totalCommissionCents: 0,
          totalDepositedCents: 0,
          totalReferralBonusCents: 0,
          totalWithdrawnCents: 0,
          transactions: [],
          updatedAt: now,
        },
        $setOnInsert: {
          id: userId,
          email: demoUser.email,
          createdAt: now,
        },
      },
      { upsert: true },
    );

    const bonusCents = await depositToWallet(users, userId, demoUser.depositCents);
    totalBonusCents += bonusCents;

    if (demoUser.withdrawalCents > 0) {
      await withdrawFromWallet(users, userId, demoUser.withdrawalCents);
    }

    const updatedUser = await users.findOne({ id: userId });

    console.log(`User ready: ${demoUser.email}`);
    console.log(`  Password: ${demoUser.password}`);
    console.log(`  Deposit: ${formatCurrency(demoUser.depositCents)}`);
    if (demoUser.withdrawalCents > 0) {
      console.log(`  Withdrawal: ${formatCurrency(demoUser.withdrawalCents)}`);
    }
    console.log(`  Balance: ${formatCurrency(updatedUser.balanceCents ?? 0)}`);
    console.log(`  Admin bonus from this deposit: ${formatCurrency(bonusCents)}`);
    console.log("");
  }

  const updatedAdmin = await users.findOne({ id: admin.id });
  const teamCount = await users.countDocuments({ referredByUserId: admin.id });

  console.log("Demo seed complete.");
  console.log(`Team members under admin: ${teamCount}`);
  console.log(`Admin referral bonus total: ${formatCurrency(updatedAdmin.totalReferralBonusCents ?? 0)}`);
  console.log(`Admin wallet balance: ${formatCurrency(updatedAdmin.balanceCents ?? 0)}`);
  console.log("");
  console.log("Login as admin to view Team / History / Profile in the UI:");
  console.log(`  Email: ${admin.email}`);
  console.log("  Password: use your ADMIN_PASSWORD from .env.local or seed:admin output");
} finally {
  await client.close();
}
