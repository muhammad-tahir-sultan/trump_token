import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/services/session-service";
import { createCSRequest, getCSRequests } from "@/features/support/services/cs-store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requests = await getCSRequests(user.id);
    return NextResponse.json(requests);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load support requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { type, message, screenshotUrl, depositAmount } = await request.json();

    if (!type || !message) {
      return NextResponse.json({ error: "Type and message are required" }, { status: 400 });
    }

    if (type === "DEPOSIT_HELP" && !screenshotUrl) {
      return NextResponse.json({ error: "Deposit screenshot proof is required" }, { status: 400 });
    }

    const newRequest = await createCSRequest(
      user.id,
      user.name || "User",
      type,
      message,
      screenshotUrl,
      depositAmount ? Number(depositAmount) : undefined
    );

    return NextResponse.json({ success: true, request: newRequest });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to submit request" },
      { status: 400 }
    );
  }
}
