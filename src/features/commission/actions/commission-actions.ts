"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/services/session-service";
import { getCommissionPreview } from "@/features/commission/services/commission-service";
import {
  CommissionAlreadyClaimedError,
  CommissionNotAvailableError,
  claimDailyCommission,
  getWalletSummary,
} from "@/features/wallet/services/wallet-store";

function getFeedbackPath(
  key: "error" | "success",
  message: string,
  extra?: Record<string, string>,
) {
  const params = new URLSearchParams({ [key]: message, ...extra });

  return `/commission?${params.toString()}`;
}

export async function claimDailyCommissionAction() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  try {
    const wallet = await getWalletSummary(user.id);
    const preview = getCommissionPreview(wallet.balanceCents);
    await claimDailyCommission(user.id);

    revalidatePath("/");
    revalidatePath("/commission");
    revalidatePath("/history");
    revalidatePath("/profile");
    redirect(
      getFeedbackPath("success", "Daily commission claimed.", {
        claimed: String(preview.amountCents),
      }),
    );
  } catch (error) {
    if (
      error instanceof CommissionAlreadyClaimedError ||
      error instanceof CommissionNotAvailableError
    ) {
      redirect(getFeedbackPath("error", error.message));
    }

    throw error;
  }
}
