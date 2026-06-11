import { MongoClient } from "mongodb";

const globalMongo = globalThis as typeof globalThis & {
  mongoClientPromise?: Promise<MongoClient>;
};

function getMongoUri() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is required to connect auth to MongoDB.");
  }

  return uri.replace(/^MONGODB_URI=/, "");
}

export async function getMongoDatabase() {
  if (!globalMongo.mongoClientPromise) {
    const client = new MongoClient(getMongoUri());
    globalMongo.mongoClientPromise = client.connect();
  }

  const client = await globalMongo.mongoClientPromise;

  return process.env.MONGODB_DB ? client.db(process.env.MONGODB_DB) : client.db();
}
