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

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:5000/api";

async function postJson(path: string, body: unknown) {
  const res = await fetch(`${BACKEND_API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message ?? "Request failed");
  }

  return data;
}

function getErrorPath(path: "/login" | "/signup", message: string) {
  const params = new URLSearchParams({ error: message });
  return `${path}?${params.toString()}`;
}

export async function signupAction(formData: FormData) {
  const input = getSignupInput(formData);
  const validationError = validateSignupInput(input);

  if (validationError) {
    redirect(getErrorPath("/signup", validationError));
  }

  try {
    const data = await postJson("/signup", {
      fullName: input.name,
      email: input.email,
      password: input.password,
      referralCode: input.referralCode || undefined,
    });

    const user: AuthenticatedUser = {
      id: data._id,
      name: data.fullName,
      email: data.email,
      referralCode: data.referralCode,
      role: data.role,
    };

    const session = JSON.stringify({ user, token: data.token });

    const cookieStore = await cookies();
    cookieStore.set("level_dashboard_session", session, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    redirect("/");
  } catch (error) {
    redirect(getErrorPath("/signup", error instanceof Error ? error.message : "Unable to create account."));
  }
}

export async function loginAction(formData: FormData) {
  const input = getLoginInput(formData);
  const validationError = validateLoginInput(input);

  if (validationError) {
    redirect(getErrorPath("/login", validationError));
  }

  try {
    const data = await postJson("/login", {
      email: input.email,
      password: input.password,
    });

    const user: AuthenticatedUser = {
      id: data._id,
      name: data.fullName,
      email: data.email,
      referralCode: data.referralCode,
      role: data.role,
    };

    const session = JSON.stringify({ user, token: data.token });

    const cookieStore = await cookies();
    cookieStore.set("level_dashboard_session", session, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    redirect("/");
  } catch (error) {
    redirect(getErrorPath("/login", error instanceof Error ? error.message : "Invalid email or password."));
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("level_dashboard_session");
  redirect("/login");
}
