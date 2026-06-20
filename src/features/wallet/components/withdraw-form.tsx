"use client";

import { useState } from "react";
import { formatCurrency } from "@/features/wallet/services/currency";
import type { WalletTransaction } from "@/features/wallet/types/wallet";

const TRC20_NETWORK = "TRON (TRC-20)";

type WithdrawFormProps = {
  balanceCents: number;
  pendingWithdrawals?: WalletTransaction[];
};

function isValidTrc20Address(address: string) {
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address.trim());
}

export function WithdrawForm({
  balanceCents,
  pendingWithdrawals = [],
}: WithdrawFormProps) {
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const amountCents = Math.round(Number(amount) * 100);
  const canWithdraw = balanceCents > 0;

  const handleSubmitWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const val = Number(amount);
    if (!amount || Number.isNaN(val) || val <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (amountCents > balanceCents) {
      setError("You can only withdraw up to your available balance.");
      return;
    }

    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      setError("TRC-20 wallet address is required.");
      return;
    }

    if (!isValidTrc20Address(trimmedAddress)) {
      setError("Enter a valid TRC-20 address (starts with T, 34 characters).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "withdrawal",
          amount: val,
          withdrawAddress: trimmedAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit withdrawal request");
      }

      setSuccess(
        "Withdrawal request submitted. Your balance has been reserved and the request is processing.",
      );
      setAmount("");
      setAddress("");
      setTimeout(() => {
        window.location.reload();
      }, 1800);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to submit withdrawal request";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdrawMax = () => {
    setAmount((balanceCents / 100).toFixed(2));
  };

  return (
    <section className="mx-auto my-4 max-w-xl rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-500">
            Wallet
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Withdraw Funds
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Withdraw USDT to your TRC-20 wallet. Amount is deducted immediately and
            processed after admin approval.
          </p>
        </div>
        <div className="shrink-0 self-start rounded-3xl bg-slate-950 px-5 py-4 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Available Balance
          </p>
          <p className="mt-1 text-2xl font-black">{formatCurrency(balanceCents)}</p>
        </div>
      </div>

      {pendingWithdrawals.length > 0 ? (
        <div className="mt-6 space-y-2">
          {pendingWithdrawals.map((withdrawal) => (
            <div
              key={withdrawal.id}
              className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm"
            >
              <p className="font-black text-amber-800">
                Processing: {formatCurrency(withdrawal.amountCents)}
              </p>
              <p className="mt-1 text-xs font-semibold text-amber-700">
                To {withdrawal.withdrawAddress} · Pending admin approval
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {success}
        </p>
      ) : null}

      <form onSubmit={handleSubmitWithdraw} className="mt-6 grid gap-5">
        <div>
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-black text-slate-700" htmlFor="withdraw-amount">
              Amount (USDT)
            </label>
            {canWithdraw ? (
              <button
                type="button"
                onClick={handleWithdrawMax}
                className="text-xs font-black text-indigo-600 hover:text-indigo-700"
              >
                Withdraw max
              </button>
            ) : null}
          </div>
          <div className="mt-2 flex rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100">
            <span className="grid w-12 place-items-center border-r border-slate-200 text-sm font-black text-slate-500">
              $
            </span>
            <input
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400"
              id="withdraw-amount"
              max={canWithdraw ? (balanceCents / 100).toFixed(2) : undefined}
              min="0.01"
              name="amount"
              placeholder="0.00"
              step="0.01"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={!canWithdraw}
            />
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-400">
            Maximum: {formatCurrency(balanceCents)}
          </p>
        </div>

        <div>
          <label className="text-sm font-black text-slate-700" htmlFor="withdraw-network">
            Network
          </label>
          <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">
            {TRC20_NETWORK}
          </div>
        </div>

        <div>
          <label className="text-sm font-black text-slate-700" htmlFor="withdraw-address">
            Your TRC-20 Wallet Address
          </label>
          <div className="mt-2 flex rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100">
            <input
              className="w-full bg-transparent px-4 py-3 font-mono text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400"
              id="withdraw-address"
              name="address"
              placeholder="T..."
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              disabled={!canWithdraw}
            />
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-400">
            Enter the USDT TRC-20 address where you want to receive funds.
          </p>
        </div>

        <button
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-sm font-black text-white transition hover:bg-indigo-700 disabled:opacity-50"
          type="submit"
          disabled={submitting || !canWithdraw || !amount || !address}
        >
          {submitting ? "Submitting request..." : "Submit Withdrawal Request"}
        </button>
      </form>

      <div className="mt-6 space-y-2 rounded-2xl border bg-slate-50 p-4 text-xs leading-relaxed text-slate-500">
        <p className="font-bold text-slate-700">Important:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>Your balance is deducted when you submit. Status shows as Processing until admin approval.</li>
          <li>If rejected, the amount is returned to your wallet automatically.</li>
          <li>Double-check your TRC-20 address. Wrong addresses cannot be recovered.</li>
        </ul>
      </div>
    </section>
  );
}
