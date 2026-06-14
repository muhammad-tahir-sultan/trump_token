import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/services/session-service";
import { getAllUsersForAdmin, adminUpdateUserBalance } from "@/features/wallet/services/wallet-store";

export async function GET() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await getAllUsersForAdmin();
    return NextResponse.json(users);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, balanceCents } = await req.json();

    if (!userId || typeof balanceCents !== "number") {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    await adminUpdateUserBalance(userId, balanceCents);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to update user balance:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user balance" },
      { status: 500 }
    );
  }
}
