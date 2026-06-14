import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/services/session-service";
import { setGlobalDepositAddress } from "@/features/wallet/services/wallet-store";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { address, network } = await request.json();
    if (!address || !network) {
      return NextResponse.json(
        { error: "Address and network are required" },
        { status: 400 }
      );
    }

    await setGlobalDepositAddress(address, network);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update deposit address" },
      { status: 500 }
    );
  }
}
