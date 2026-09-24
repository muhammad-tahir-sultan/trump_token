"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  getLoginInput,
  getSignupInput,
  validateLoginInput,
  validateSignupInput,
} from "@/features/auth/services/auth-validation";
import type { AuthenticatedUser } from "@/features/auth/types/auth";
import {
  createUser,
  DuplicateUserEmailError,
  findUserByEmail,
  InvalidReferralCodeError,
} from "@/features/auth/services/user-store";
import { verifyPassword } from "@/features/auth/services/password-service";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:5000/api";

function sanitizeErrorMessage(rawMessage: string, status?: number): string {
  if (
    rawMessage.includes("FUNCTION_INVOCATION_FAILED") ||
    rawMessage.includes("A server error has occurred") ||
    rawMessage.includes("Internal Server Error") ||
    (status !== undefined && status >= 500)
  ) {
    return "Authentication service is temporarily unavailable. Please try again shortly.";
  }
  return rawMessage;
}

async function postJson(path: string, body: unknown) {
  const res = await fetch(`${BACKEND_API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    let message = text || `Request failed with status ${res.status}`;
    try {
      const data = JSON.parse(text);
      message = data.message ?? message;
    } catch {
      message = sanitizeErrorMessage(message, res.status);
    }
    throw new Error(message);
  }

  return res.json();
}

function getErrorPath(path: "/login" | "/signup", message: string) {
  const sanitized = sanitizeErrorMessage(message);
  const params = new URLSearchParams({ error: sanitized });
  return `${path}?${params.toString()}`;
}

export async function signupAction(formData: FormData) {
  const input = getSignupInput(formData);
  const validationError = validateSignupInput(input);

  if (validationError) {
    redirect(getErrorPath("/signup", validationError));
  }

  let shouldRedirect = false;
  let redirectError: string | null = null;

  try {
    let user: AuthenticatedUser | null = null;
    let token = "";

    try {
      const data = await postJson("/signup", {
        fullName: input.name,
        email: input.email,
        password: input.password,
        referralCode: input.referralCode || undefined,
      });

      user = {
        id: data._id,
        name: data.fullName ?? data.name ?? "",
        email: data.email,
        referralCode: data.referralCode,
        role: data.role,
      };
      token = data.token;
    } catch (apiError: any) {
      console.warn("Backend API signup failed, attempting direct database fallback:", apiError?.message);
      // Attempt direct MongoDB registration fallback
      try {
        const storedUser = await createUser(input);
        user = {
          id: storedUser.id,
          name: storedUser.name,
          email: storedUser.email,
          referralCode: storedUser.referralCode,
          role: storedUser.role,
        };
        token = `db_session_${storedUser.id}_${Date.now()}`;
      } catch (dbError) {
        if (dbError instanceof DuplicateUserEmailError) {
          throw new Error("An account already exists for this email.");
        }
        if (dbError instanceof InvalidReferralCodeError) {
          throw new Error("Referral code is invalid.");
        }
        // If DB registration also failed, re-throw sanitized API error
        throw apiError;
      }
    }

    if (user) {
      const session = JSON.stringify({ user, token });
      const cookieStore = await cookies();
      cookieStore.set("level_dashboard_session", session, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
      shouldRedirect = true;
    }
  } catch (error) {
    redirectError = error instanceof Error ? error.message : "Unable to create account.";
  }

  if (shouldRedirect) {
    redirect("/");
  }

  if (redirectError) {
    redirect(getErrorPath("/signup", redirectError));
  }
}

export async function loginAction(formData: FormData) {
  const input = getLoginInput(formData);
  const validationError = validateLoginInput(input);

  if (validationError) {
    redirect(getErrorPath("/login", validationError));
  }

  let shouldRedirect = false;
  let redirectError: string | null = null;

  try {
    let user: AuthenticatedUser | null = null;
    let token = "";

    try {
      const data = await postJson("/login", {
        email: input.email,
        password: input.password,
      });

      user = {
        id: data._id,
        name: data.fullName ?? data.name ?? "",
        email: data.email,
        referralCode: data.referralCode,
        role: data.role,
      };
      token = data.token;
    } catch (apiError: any) {
      console.warn("Backend API login failed, attempting direct database fallback:", apiError?.message);
      // Attempt direct MongoDB authentication fallback
      try {
        const storedUser = await findUserByEmail(input.email);
        if (storedUser && verifyPassword(input.password, storedUser.passwordHash)) {
          user = {
            id: storedUser.id,
            name: storedUser.name,
            email: storedUser.email,
            referralCode: storedUser.referralCode,
            role: storedUser.role,
          };
          token = `db_session_${storedUser.id}_${Date.now()}`;
        } else {
          throw new Error("Invalid email or password.");
        }
      } catch (dbError: any) {
        if (dbError?.message === "Invalid email or password.") {
          throw dbError;
        }
        // If DB also failed, re-throw sanitized API error
        throw apiError;
      }
    }

    if (user) {
      const session = JSON.stringify({ user, token });
      const cookieStore = await cookies();
      cookieStore.set("level_dashboard_session", session, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
      shouldRedirect = true;
    }
  } catch (error) {
    redirectError = error instanceof Error ? error.message : "Invalid email or password.";
  }

  if (shouldRedirect) {
    redirect("/");
  }

  if (redirectError) {
    redirect(getErrorPath("/login", redirectError));
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("level_dashboard_session");
  redirect("/login");
}
