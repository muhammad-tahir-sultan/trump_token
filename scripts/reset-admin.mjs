import { readFileSync } from "fs";
import { MongoClient } from "mongodb";

const envFilePath = ".env.local";

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

loadLocalEnv();

const client = new MongoClient(getMongoUri());

try {
  await client.connect();

  const database = process.env.MONGODB_DB ? client.db(process.env.MONGODB_DB) : client.db();
  const users = database.collection("users");

  const deleteResult = await users.deleteMany({ role: "admin" });

  console.log(`Removed ${deleteResult.deletedCount} admin user(s).`);
} finally {
  await client.close();
}
