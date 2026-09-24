import { createHash } from "crypto";
import bcrypt from "bcryptjs";

const saltRounds = 10;

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, saltRounds);
}

export function verifyPassword(password: string, storedHash: string) {
  if (!storedHash) {
    return false;
  }

  if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$")) {
    return bcrypt.compareSync(password, storedHash);
  }

  if (storedHash.includes(":")) {
    const [salt, digest] = storedHash.split(":");
    return createHash("sha256").update(`${salt}${password}`).digest("hex") === digest;
  }

  const saltLength = 32;
  if (storedHash.length === 64) {
    const salt = storedHash.slice(0, saltLength);
    return createHash("sha256").update(`${salt}${password}`).digest("hex") === storedHash.slice(saltLength);
  }

  return false;
}
