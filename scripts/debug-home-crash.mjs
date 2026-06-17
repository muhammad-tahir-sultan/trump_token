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

try {
  await client.connect();
  const users = client.db().collection("users");
  const all = await users.find({}).toArray();

  console.log(`Users: ${all.length}`);

  for (const user of all) {
    console.log(`\nUser: ${user.email}`);
    try {
      if (user.commissionUnlockAt) {
        const unlock = new Date(user.commissionUnlockAt);
        console.log("  commissionUnlockAt:", unlock.toISOString());
      }

      for (const transaction of user.transactions ?? []) {
        const createdAt =
          transaction.createdAt instanceof Date
            ? transaction.createdAt
            : new Date(transaction.createdAt);
        createdAt.toISOString();
      }
      console.log("  transactions OK:", (user.transactions ?? []).length);
    } catch (error) {
      console.error("  ERROR:", error.message);
      console.error("  Bad data:", JSON.stringify(user, null, 2).slice(0, 2000));
    }
  }
} finally {
  await client.close();
}
