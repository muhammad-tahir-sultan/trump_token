import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/services/session-service";
import { adminGetUserById } from "@/features/admin/services/admin-user-store";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  const admin = await getCurrentUser();

  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await context.params;
  const user = await adminGetUserById(userId);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}
