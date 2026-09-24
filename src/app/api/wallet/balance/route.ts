import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/services/session-service";
import { getWalletSummary } from "@/features/wallet/services/wallet-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const wallet = await getWalletSummary(user.id);
    return NextResponse.json({
      balanceCents: wallet.balanceCents,
      totalDepositedCents: wallet.totalDepositedCents,
      totalWithdrawnCents: wallet.totalWithdrawnCents,
    });
  } catch (err: any) {
    console.error("Failed to get wallet balance in API route:", err);
    return NextResponse.json(
      { error: "Failed to retrieve balance" },
      { status: 500 },
    );
  }
}
