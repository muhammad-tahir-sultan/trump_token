import { NextResponse } from "next/server";
import { getSessionToken } from "@/features/auth/services/session-service";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:5000/api";

export async function GET() {
  const token = await getSessionToken();

  const res = await fetch(`${BACKEND_API_URL}/deposit/address`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to load deposit address" },
      { status: res.status },
    );
  }

  return NextResponse.json(await res.json());
}
