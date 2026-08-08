import { cookies } from "next/headers";
import type { AuthenticatedUser } from "@/features/auth/types/auth";

const sessionCookieName = "level_dashboard_session";

type SessionPayload = {
  user: AuthenticatedUser;
  token: string;
};

export async function createSession(session: SessionPayload) {
  const cookieStore = await cookies();

  cookieStore.set(sessionCookieName, JSON.stringify(session), {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
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

  try {
    const payload = JSON.parse(session) as SessionPayload;
    return payload.user;
  } catch {
    return null;
  }
}

export async function getSessionToken() {
  const cookieStore = await cookies();
  const session = cookieStore.get(sessionCookieName)?.value;

  if (!session) {
    return null;
  }

  try {
    const payload = JSON.parse(session) as SessionPayload;
    return payload.token;
  } catch {
    return null;
  }
}
