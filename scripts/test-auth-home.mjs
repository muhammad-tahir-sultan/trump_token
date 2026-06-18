import { createHmac } from "crypto";
import { readFileSync } from "fs";

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
const payload = Buffer.from(
  JSON.stringify({
    id: "eebd2365-f945-4097-a3cb-4f095f8e0815",
    name: "Admin",
    email: "admin@rivochain.com",
    referralCode: "ADMIN-C9C336",
    role: "admin",
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  }),
).toString("base64url");
const signature = createHmac("sha256", secret).update(payload).digest("hex");
const cookie = `level_dashboard_session=${payload}.${signature}`;

for (const url of ["http://localhost:3001/", "https://rivochain.vercel.app/"]) {
  const response = await fetch(url, {
    headers: { Cookie: cookie },
    redirect: "manual",
  });
  const text = await response.text();
  const digestMatch = text.match(/digest":"([^"]+)"/);
  console.log(url, response.status, digestMatch?.[1] ?? "no digest");
  if (response.status >= 500) {
    console.log(text.match(/E\{[^}]+\}/)?.[0] ?? text.slice(0, 500));
  }
}
