import type { LoginInput, SignupInput } from "@/features/auth/types/auth";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const minimumPasswordLength = 8;
const referralCodePattern = /^[a-zA-Z0-9-]{4,24}$/;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getSignupInput(formData: FormData): SignupInput {
  return {
    name: String(formData.get("name") ?? "").trim(),
    email: normalizeEmail(String(formData.get("email") ?? "")),
    password: String(formData.get("password") ?? ""),
    referralCode: String(formData.get("referralCode") ?? "")
      .trim()
      .toUpperCase(),
  };
}

export function getLoginInput(formData: FormData): LoginInput {
  return {
    email: normalizeEmail(String(formData.get("email") ?? "")),
    password: String(formData.get("password") ?? ""),
  };
}

export function validateSignupInput(input: SignupInput): string | null {
  if (input.name.length < 2) {
    return "Please enter your full name.";
  }

  if (!emailPattern.test(input.email)) {
    return "Please enter a valid email address.";
  }

  if (input.password.length < minimumPasswordLength) {
    return "Password must be at least 8 characters.";
  }

  if (!referralCodePattern.test(input.referralCode)) {
    return "Please enter a valid referral code.";
  }

  return null;
}

export function validateLoginInput(input: LoginInput): string | null {
  if (!emailPattern.test(input.email)) {
    return "Please enter a valid email address.";
  }

  if (!input.password) {
    return "Please enter your password.";
  }

  return null;
}
