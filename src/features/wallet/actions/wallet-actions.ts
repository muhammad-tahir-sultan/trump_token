"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/services/session-service";
import { getAmountCents } from "@/features/wallet/services/wallet-validation";
import {
  depositToWallet,
  InsufficientBalanceError,
  withdrawFromWallet,
} from "@/features/wallet/services/wallet-store";

type WalletActionPath = "/deposit" | "/withdraw";

function getFeedbackPath(path: WalletActionPath, key: "error" | "success", message: string) {
  const params = new URLSearchParams({ [key]: message });

  return `${path}?${params.toString()}`;
}

async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function depositAction(formData: FormData) {
  const user = await requireUser();
  let amountCents: number;

  try {
    amountCents = getAmountCents(formData);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Enter a valid amount.";

    redirect(getFeedbackPath("/deposit", "error", message));
  }

  if (amountCents < 10_00) {
    redirect(getFeedbackPath("/deposit", "error", "Minimum deposit is $10.00."));
  }

  await depositToWallet(user.id, amountCents);
  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/history");
  redirect(getFeedbackPath("/deposit", "success", "Deposit completed."));
}

export async function withdrawAction(formData: FormData) {
  const user = await requireUser();
  let amountCents: number;

  try {
    amountCents = getAmountCents(formData);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Enter a valid amount.";

    redirect(getFeedbackPath("/withdraw", "error", message));
  }

  try {
    await withdrawFromWallet(user.id, amountCents);
  } catch (error) {
    if (error instanceof InsufficientBalanceError) {
      redirect(getFeedbackPath("/withdraw", "error", error.message));
    }

    throw error;
  }

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/history");
  redirect(getFeedbackPath("/withdraw", "success", "Withdrawal completed."));
}
