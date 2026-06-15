import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/services/session-service";
import {
  buildWhatsappUrl,
  getSupportWhatsappNumber,
} from "@/features/support/services/support-settings-store";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const phoneNumber = await getSupportWhatsappNumber();

    return NextResponse.json({
      phoneNumber,
      whatsappUrl: phoneNumber ? buildWhatsappUrl(phoneNumber) : "",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load WhatsApp support";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
