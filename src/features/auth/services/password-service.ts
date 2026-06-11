import { createHash, randomBytes, timingSafeEqual } from "crypto";

const separator = ":";

function digestPassword(password: string, salt: string) {
  return createHash("sha256").update(`${salt}${password}`).digest("hex");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const digest = digestPassword(password, salt);

  return `${salt}${separator}${digest}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, digest] = storedHash.split(separator);

  if (!salt || !digest) {
    return false;
  }

  const incomingDigest = digestPassword(password, salt);
  const storedBuffer = Buffer.from(digest, "hex");
  const incomingBuffer = Buffer.from(incomingDigest, "hex");

  return (
    storedBuffer.length === incomingBuffer.length &&
    timingSafeEqual(storedBuffer, incomingBuffer)
  );
}
