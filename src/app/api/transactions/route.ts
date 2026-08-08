import { NextResponse } from "next/server";
import { getCurrentUser, getSessionToken } from "@/features/auth/services/session-service";
import { depositToWallet, withdrawFromWallet } from "@/features/wallet/services/wallet-api";
import { isValidTrc20Address } from "@/features/wallet/services/wallet-validation";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:5000/api";

async function backendRequest(path: string, options: RequestInit = {}) {
  const token = await getSessionToken();
  const res = await fetch(`${BACKEND_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    let message = text || `Request failed with status ${res.status}`;
    try {
      const data = JSON.parse(text);
      message = data.message ?? message;
    } catch {
      // keep plain text message
    }
    return NextResponse.json({ error: message }, { status: res.status });
  }

  return NextResponse.json(await res.json());
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { type, amount, depositAddress, withdrawAddress, screenshotUrl } =
      await request.json();

    if (!type || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Invalid type or amount" }, { status: 400 });
    }

    const amountCents = Math.round(Number(amount) * 100);

    if (type === "deposit") {
      if (!depositAddress) {
        return NextResponse.json({ error: "Deposit address is required" }, { status: 400 });
      }
      const transactionId = await depositToWallet(user.id, amountCents, depositAddress, screenshotUrl);

      return NextResponse.json({ success: true, transactionId });
    }

    if (type === "withdrawal") {
      if (!withdrawAddress || typeof withdrawAddress !== "string") {
        return NextResponse.json(
          { error: "TRC-20 wallet address is required." },
          { status: 400 },
        );
      }

      if (!isValidTrc20Address(withdrawAddress)) {
        return NextResponse.json(
          { error: "Enter a valid TRC-20 wallet address (starts with T, 34 characters)." },
          { status: 400 },
        );
      }

      const transactionId = await withdrawFromWallet(
        user.id,
        amountCents,
        withdrawAddress.trim(),
        "TRON (TRC-20)",
      );

      return NextResponse.json({ success: true, transactionId });
    }

    return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Transaction request failed";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

