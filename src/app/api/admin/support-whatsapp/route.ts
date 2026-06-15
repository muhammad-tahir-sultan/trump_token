import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/services/session-service";
import { setSupportWhatsappNumber } from "@/features/support/services/support-settings-store";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber || typeof phoneNumber !== "string") {
      return NextResponse.json(
        { error: "WhatsApp number is required." },
        { status: 400 },
      );
    }

    const normalized = await setSupportWhatsappNumber(phoneNumber);

    return NextResponse.json({ success: true, phoneNumber: normalized });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update WhatsApp number";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
