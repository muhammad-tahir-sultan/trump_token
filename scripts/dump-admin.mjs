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
  const admin = await client.db().collection("users").findOne({ email: "admin@rivochain.com" });
  console.log(JSON.stringify(admin, null, 2));
} finally {
  await client.close();
}
