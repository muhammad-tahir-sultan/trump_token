import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/services/session-service";
import {
  getAllTransactions,
  approveTransaction,
  rejectTransaction,
} from "@/features/wallet/services/wallet-store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const txs = await getAllTransactions();
    return NextResponse.json(txs);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, userId, transactionId, remark } = await request.json();

    if (!action || !userId || !transactionId) {
      return NextResponse.json(
        { error: "Missing required parameters: action, userId, transactionId" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      await approveTransaction(userId, transactionId);
    } else if (action === "reject") {
      await rejectTransaction(userId, transactionId, remark);
    } else {
      return NextResponse.json({ error: "Invalid action. Use approve or reject" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Action failed" },
      { status: 500 }
    );
  }
}
