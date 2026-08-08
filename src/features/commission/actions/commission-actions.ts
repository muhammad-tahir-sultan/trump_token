"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/services/session-service";
import { getCommissionPreview } from "@/features/commission/services/commission-service";
import {
  claimDailyCommission,
  claimDailyReferralCommission,
  getReferralCommissionStatus,
  getWalletSummary,
} from "@/features/wallet/services/wallet-api";
import {
  CommissionAlreadyClaimedError,
  CommissionLockedError,
  CommissionNotAvailableError,
  ReferralCommissionAlreadyClaimedError,
  ReferralCommissionNotAvailableError,
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
    const preview = getCommissionPreview(wallet.totalDepositedCents);
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
      error instanceof CommissionLockedError ||
      error instanceof CommissionNotAvailableError
    ) {
      redirect(getFeedbackPath("error", error.message));
    }

    throw error;
  }
}

export async function claimDailyReferralCommissionAction() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  try {
    const preview = await getReferralCommissionStatus(user.id);
    const claimedCents = await claimDailyReferralCommission(user.id);

    revalidatePath("/");
    revalidatePath("/commission");
    revalidatePath("/history");
    revalidatePath("/profile");
    revalidatePath("/team");
    redirect(
      getFeedbackPath("success", "Referral commission claimed.", {
        referralClaimed: String(claimedCents || preview.amountCents),
      }),
    );
  } catch (error) {
    if (
      error instanceof ReferralCommissionAlreadyClaimedError ||
      error instanceof ReferralCommissionNotAvailableError
    ) {
      redirect(getFeedbackPath("error", error.message));
    }

    throw error;
  }
}
