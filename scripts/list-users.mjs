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

try {
  await client.connect();
  const users = client.db().collection("users");
  const all = await users
    .find({}, { projection: { email: 1, role: 1, name: 1 } })
    .toArray();

  console.log("Current users in DB:");
  for (const user of all) {
    console.log(`- ${user.email} | role: ${user.role ?? "user"}`);
  }
  console.log(`Total: ${all.length}`);
} finally {
  await client.close();
}
