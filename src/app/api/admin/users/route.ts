import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/services/session-service";
import {
  adminDeleteUser,
  adminResetUserPassword,
  adminUpdateUser,
  adminUpdateUserBalance,
  adminGetUserById,
  getAllUsersForAdmin,
} from "@/features/admin/services/admin-user-store";

async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return null;
  }

  return user;
}

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await getAllUsersForAdmin();
    return NextResponse.json(users);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    if (action === "balance") {
      const { balanceCents } = body;

      if (typeof balanceCents !== "number" || balanceCents < 0) {
        return NextResponse.json({ error: "Invalid balance" }, { status: 400 });
      }

      await adminUpdateUserBalance(userId, balanceCents);
      return NextResponse.json({ success: true });
    }

    if (action === "update") {
      const { name, email, role } = body;

      if (role && role !== "admin" && role !== "user") {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }

      await adminUpdateUser(userId, { name, email, role });
      return NextResponse.json({ success: true });
    }

    if (action === "password") {
      const { newPassword } = body;

      if (!newPassword || String(newPassword).length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters." },
          { status: 400 },
        );
      }

      await adminResetUserPassword(userId, String(newPassword));
      return NextResponse.json({ success: true, newPassword: String(newPassword) });
    }

    if (action === "delete") {
      await adminDeleteUser(userId, admin.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Operation failed";
    console.error("Admin user action failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
