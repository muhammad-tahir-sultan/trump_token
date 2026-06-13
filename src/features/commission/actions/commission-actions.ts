"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/services/session-service";
import {
  CommissionAlreadyClaimedError,
  CommissionNotAvailableError,
  claimDailyCommission,
} from "@/features/wallet/services/wallet-store";

function getFeedbackPath(key: "error" | "success", message: string) {
  const params = new URLSearchParams({ [key]: message });

  return `/commission?${params.toString()}`;
}

export async function claimDailyCommissionAction() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  try {
    await claimDailyCommission(user.id);
  } catch (error) {
    if (
      error instanceof CommissionAlreadyClaimedError ||
      error instanceof CommissionNotAvailableError
    ) {
      redirect(getFeedbackPath("error", error.message));
    }

    throw error;
  }

  revalidatePath("/");
  revalidatePath("/commission");
  revalidatePath("/history");
  revalidatePath("/profile");
  redirect(getFeedbackPath("success", "Daily commission claimed."));
}
