import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/services/session-service";
import {
  depositToWallet,
  withdrawFromWallet,
  updateTransactionScreenshot,
} from "@/features/wallet/services/wallet-store";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { type, amount, depositAddress, withdrawAddress, withdrawNetwork, screenshotUrl } = await request.json();

    if (!type || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Invalid type or amount" }, { status: 400 });
    }

    const amountCents = Math.round(Number(amount) * 100);

    if (type === "deposit") {
      if (!depositAddress) {
        return NextResponse.json({ error: "Deposit address is required" }, { status: 400 });
      }
      const transactionId = await depositToWallet(user.id, amountCents, depositAddress);

      if (screenshotUrl) {
        await updateTransactionScreenshot(user.id, transactionId, screenshotUrl);
      }

      return NextResponse.json({ success: true, transactionId });
    } else if (type === "withdrawal") {
      if (!withdrawAddress || !withdrawNetwork) {
        return NextResponse.json({ error: "Withdraw address and network are required" }, { status: 400 });
      }
      await withdrawFromWallet(user.id, amountCents, withdrawAddress, withdrawNetwork);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Transaction request failed" },
      { status: 400 }
    );
  }
}
