import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/services/session-service";
import { getCSRequests, updateCSRequestStatus } from "@/features/support/services/cs-store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Calling getCSRequests with no arguments returns all tickets
    const requests = await getCSRequests();
    return NextResponse.json(requests);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to load support tickets" },
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
    const { requestId, status, remark } = await request.json();

    if (!requestId || !status) {
      return NextResponse.json(
        { error: "Missing required parameters: requestId, status" },
        { status: 400 }
      );
    }

    await updateCSRequestStatus(requestId, status, remark);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update support ticket" },
      { status: 500 }
    );
  }
}
