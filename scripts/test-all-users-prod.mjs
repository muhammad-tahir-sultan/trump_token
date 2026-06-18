import { createHmac } from "crypto";
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

const secret = process.env.AUTH_SECRET ?? "development-only-level-dashboard-secret";
const uri = process.env.MONGODB_URI?.replace(/^MONGODB_URI=/, "");
const client = new MongoClient(uri);

function createCookie(user) {
  const payload = Buffer.from(
    JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      referralCode: user.referralCode,
      role: user.role,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    }),
  ).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return `level_dashboard_session=${payload}.${signature}`;
}

try {
  await client.connect();
  const users = await client.db().collection("users").find({}).toArray();

  for (const user of users) {
    const cookie = createCookie(user);
    const response = await fetch("https://rivochain.vercel.app/", {
      headers: { Cookie: cookie },
      redirect: "manual",
    });
    const text = await response.text();
    const digestMatch = text.match(/digest":"([^"]+)"/);
    console.log(
      user.email,
      response.status,
      digestMatch?.[1] ?? (response.status === 200 ? "OK" : "error"),
    );
    if (response.status >= 500) {
      console.log(text.match(/E\{[^}]+\}/)?.[0] ?? text.slice(0, 400));
    }
  }
} finally {
  await client.close();
}
