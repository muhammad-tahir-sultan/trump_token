import { NextResponse } from "next/server";
import { getAdminPlatformStats } from "@/features/admin/services/admin-stats-store";
import { getCurrentUser } from "@/features/auth/services/session-service";

export async function GET() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await getAdminPlatformStats();
    return NextResponse.json(stats);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load admin stats";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
