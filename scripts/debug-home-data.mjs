import { readFileSync } from "fs";
import { MongoClient } from "mongodb";

const envFile = readFileSync(".env.local", "utf8");
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

const uri = process.env.MONGODB_URI?.replace(/^MONGODB_URI=/, "");
const client = new MongoClient(uri);

function getTodayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getReferralCommissionPreview(teamBalanceCents, teamMemberCount) {
  return {
    amountCents: Math.floor((teamBalanceCents * 1) / 100),
    rate: 1,
    teamBalanceCents,
    teamMemberCount,
  };
}

function getTodayTeamCommissionCents(transactions) {
  const todayKey = getTodayKey();
  return transactions
    .filter((transaction) => {
      if (transaction.status !== "completed") return false;
      if (
        transaction.type !== "referral_bonus" &&
        transaction.type !== "referral_first_day_commission" &&
        transaction.type !== "referral_daily_commission"
      ) {
        return false;
      }
      const createdAt =
        transaction.createdAt instanceof Date
          ? transaction.createdAt
          : new Date(transaction.createdAt);
      return createdAt.toISOString().slice(0, 10) === todayKey;
    })
    .reduce((total, transaction) => total + transaction.amountCents, 0);
}

function toWalletSummary(document) {
  const transactions = document.transactions ?? [];
  return {
    balanceCents: document.balanceCents ?? 0,
    commissionUnlockAt: document.commissionUnlockAt
      ? new Date(document.commissionUnlockAt).toISOString()
      : null,
    totalReferralBonusCents: document.totalReferralBonusCents ?? 0,
    transactions,
  };
}

try {
  await client.connect();
  const users = client.db().collection("users");
  const all = await users.find({}).toArray();

  for (const user of all) {
    console.log(`Testing home data for ${user.email}`);
    const wallet = toWalletSummary(user);
    const todayTeamCommissionCents = getTodayTeamCommissionCents(wallet.transactions);
    const members = await users.find({ referredByUserId: user.id }).toArray();
    const teamBalanceCents = members.reduce((t, m) => t + (m.balanceCents ?? 0), 0);
    const referralPreview = getReferralCommissionPreview(teamBalanceCents, members.length);
    console.log("  OK", {
      todayTeamCommissionCents,
      referralPreview,
      commissionUnlockAt: wallet.commissionUnlockAt,
    });
  }
} finally {
  await client.close();
}
