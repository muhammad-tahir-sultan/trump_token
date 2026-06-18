import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { findUserById } from "@/features/auth/services/user-store";
import type { AuthenticatedUser } from "@/features/auth/types/auth";

const sessionCookieName = "level_dashboard_session";
const sessionMaxAgeInSeconds = 60 * 60 * 24 * 7;

type SessionPayload = AuthenticatedUser & {
  expiresAt: number;
};

function getSessionSecret() {
  return process.env.AUTH_SECRET ?? "development-only-level-dashboard-secret";
}

function encodePayload(payload: SessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(value: string): SessionPayload | null {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

function signaturesMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export async function createSession(user: AuthenticatedUser) {
  const payload = encodePayload({
    ...user,
    expiresAt: Date.now() + sessionMaxAgeInSeconds * 1000,
  });
  const cookieStore = await cookies();

  cookieStore.set(sessionCookieName, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    maxAge: sessionMaxAgeInSeconds,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();

  cookieStore.delete(sessionCookieName);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get(sessionCookieName)?.value;

  if (!session) {
    return null;
  }

  const [payload, signature] = session.split(".");

  if (!payload || !signature || !signaturesMatch(sign(payload), signature)) {
    return null;
  }

  const decodedPayload = decodePayload(payload);

  if (!decodedPayload || decodedPayload.expiresAt < Date.now()) {
    return null;
  }

  const user = await findUserById(decodedPayload.id);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    referralCode: user.referralCode,
    role: user.role,
  };
}
