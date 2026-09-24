import { NextResponse } from "next/server";
import { getSessionToken } from "@/features/auth/services/session-service";

import { getGlobalDepositAddress } from "@/features/wallet/services/wallet-store";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:5000/api";

export async function GET() {
  const token = await getSessionToken();

  try {
    const res = await fetch(`${BACKEND_API_URL}/transactions/deposit/address`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.address) {
        return NextResponse.json({
          address: data.address,
          network: data.network || "TRC20 (Tron)",
          qrCodeUrl: data.qrCodeUrl || "/deposit-qr.png",
        });
      }
    }
  } catch (err) {
    console.error("Backend deposit address fetch error:", err);
  }

  // Fallback to local MongoDB settings or default
  try {
    const fallback = await getGlobalDepositAddress();
    return NextResponse.json({
      address: fallback.address,
      network: fallback.network,
      qrCodeUrl: "/deposit-qr.png",
    });
  } catch {
    return NextResponse.json({
      address: "TV5A9TnQnHDrKrHgVeUsxiwqekDFj582tG",
      network: "TRC20 (Tron)",
      qrCodeUrl: "/deposit-qr.png",
    });
  }
}
