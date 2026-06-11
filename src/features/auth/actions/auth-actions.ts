"use server";

import { redirect } from "next/navigation";
import {
  getLoginInput,
  getSignupInput,
  validateLoginInput,
  validateSignupInput,
} from "@/features/auth/services/auth-validation";
import { verifyPassword } from "@/features/auth/services/password-service";
import {
  createSession,
  destroySession,
} from "@/features/auth/services/session-service";
import type { StoredUser } from "@/features/auth/types/auth";
import {
  createUser,
  DuplicateUserEmailError,
  findUserByEmail,
} from "@/features/auth/services/user-store";

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

  const existingUser = await findUserByEmail(input.email);

  if (existingUser) {
    redirect(getErrorPath("/signup", "An account already exists for this email."));
  }

  let user: StoredUser;

  try {
    user = await createUser(input);
  } catch (error) {
    if (error instanceof DuplicateUserEmailError) {
      redirect(getErrorPath("/signup", error.message));
    }

    throw error;
  }

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
  });

  redirect("/");
}

export async function loginAction(formData: FormData) {
  const input = getLoginInput(formData);
  const validationError = validateLoginInput(input);

  if (validationError) {
    redirect(getErrorPath("/login", validationError));
  }

  const user = await findUserByEmail(input.email);
  const isPasswordValid = user
    ? verifyPassword(input.password, user.passwordHash)
    : false;

  if (!user || !isPasswordValid) {
    redirect(getErrorPath("/login", "Invalid email or password."));
  }

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
  });

  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
