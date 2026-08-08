import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/services/session-service";
import { backendGet, backendPatch } from "@/features/auth/services/backend-api-client";

function toAdminTransaction(tx: any) {
  return {
    id: tx._id,
    userId: tx.user?._id ?? tx.user,
    userName: tx.user?.fullName ?? tx.userName ?? "",
    userEmail: tx.user?.email ?? tx.userEmail ?? "",
    type: tx.type,
    amountCents: Math.round((Number(tx.amount) || 0) * 100),
    status: tx.status,
    depositAddress: tx.walletAddress,
    withdrawAddress: tx.walletAddress,
    withdrawNetwork: tx.network,
    screenshotUrl: tx.paymentScreenshotUrl,
    adminRemark: tx.adminRemark,
    createdAt: tx.createdAt,
  };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const txs = await backendGet("/admin/transactions");
    const transformed = (Array.isArray(txs) ? txs : []).map(toAdminTransaction);
    return NextResponse.json(transformed);
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

    const status = action === "approve" ? "approved" : "rejected";

    await backendPatch(`/admin/transactions/${transactionId}`, {
      status,
      userId,
      remark: remark || (action === "reject" ? "Rejected by admin" : ""),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Action failed" },
      { status: 500 }
    );
  }
}
