import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/services/session-service";
import {
  buildWhatsappUrl,
  getSupportWhatsappSettings,
} from "@/features/support/services/support-settings-store";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await getSupportWhatsappSettings();
    const isVisible = settings.enabled && settings.phoneNumber.length > 0;

    return NextResponse.json({
      phoneNumber: settings.phoneNumber,
      enabled: settings.enabled,
      whatsappUrl: isVisible ? buildWhatsappUrl(settings.phoneNumber) : "",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load WhatsApp support";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
