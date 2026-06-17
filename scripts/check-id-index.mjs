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
  const all = await users.find({}, { projection: { id: 1, email: 1 } }).toArray();
  const ids = all.map((u) => u.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  console.log("Users:", all.length, "Duplicate ids:", dupes);

  try {
    await users.createIndex({ id: 1 }, { unique: true });
    console.log("id index: OK");
  } catch (error) {
    console.error("id index failed:", error.message);
  }
} finally {
  await client.close();
}
