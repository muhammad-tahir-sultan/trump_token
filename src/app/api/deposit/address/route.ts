import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/services/session-service";
import { getGlobalDepositAddress } from "@/features/wallet/services/wallet-store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const addressInfo = await getGlobalDepositAddress();
    return NextResponse.json(addressInfo);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load deposit address" },
      { status: 500 }
    );
  }
}
