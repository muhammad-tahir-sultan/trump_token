import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/services/session-service";
import { updateSupportWhatsappSettings } from "@/features/support/services/support-settings-store";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const phoneNumber =
      typeof body.phoneNumber === "string" ? body.phoneNumber : undefined;
    const enabled =
      typeof body.enabled === "boolean" ? body.enabled : undefined;

    if (phoneNumber === undefined && enabled === undefined) {
      return NextResponse.json(
        { error: "Provide a WhatsApp number or enabled flag to update." },
        { status: 400 },
      );
    }

    if (phoneNumber !== undefined && !phoneNumber.trim()) {
      return NextResponse.json(
        { error: "WhatsApp number is required." },
        { status: 400 },
      );
    }

    const settings = await updateSupportWhatsappSettings({
      phoneNumber,
      enabled,
    });

    return NextResponse.json({ success: true, ...settings });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update WhatsApp settings";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
