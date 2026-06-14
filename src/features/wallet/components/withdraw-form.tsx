"use client";

import { useState } from "react";
import { formatCurrency } from "@/features/wallet/services/currency";
import Link from "next/link";

type WithdrawFormProps = {
  balanceCents: number;
};

export function WithdrawForm({ balanceCents }: WithdrawFormProps) {
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [network, setNetwork] = useState("TRON (TRC-20)");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const val = Number(amount);
    if (!amount || isNaN(val) || val <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (val * 100 > balanceCents) {
      setError("Withdrawal amount cannot exceed your available balance.");
      return;
    }

    if (!address.trim()) {
      setError("Destination wallet address is required.");
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
          withdrawAddress: address,
          withdrawNetwork: network,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit withdrawal request");
      }

      setSuccess("Withdrawal request submitted! Pending admin approval.");
      setAmount("");
      setAddress("");
      // Force window reload or revalidation path after short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to submit withdrawal request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm max-w-xl mx-auto my-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-500">
            Wallet
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Withdraw Funds
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Withdraw available balance from your Rivochain wallet.
          </p>
        </div>
        <div className="rounded-3xl bg-slate-950 px-5 py-4 text-white shrink-0 self-start">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Balance
          </p>
          <p className="mt-1 text-2xl font-black">{formatCurrency(balanceCents)}</p>
        </div>
      </div>

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
          <label className="text-sm font-black text-slate-700" htmlFor="withdraw-amount">
            Amount
          </label>
          <div className="mt-2 flex rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100">
            <span className="grid w-12 place-items-center border-r border-slate-200 text-sm font-black text-slate-500">
              $
            </span>
            <input
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400"
              id="withdraw-amount"
              min="1"
              name="amount"
              placeholder="10.00"
              step="0.01"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-black text-slate-700" htmlFor="withdraw-network">
            Network
          </label>
          <div className="mt-2 flex rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100">
            <select
              className="w-full bg-transparent px-4 py-3 text-sm font-bold text-slate-950 outline-none cursor-pointer"
              id="withdraw-network"
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
            >
              <option value="TRON (TRC-20)">TRON (TRC-20) - Fast & Cheap</option>
              <option value="Ethereum (ERC-20)">Ethereum (ERC-20)</option>
              <option value="Binance Smart Chain (BEP-20)">Binance Smart Chain (BEP-20)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-black text-slate-700" htmlFor="withdraw-address">
            Destination Wallet Address
          </label>
          <div className="mt-2 flex rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100">
            <input
              className="w-full bg-transparent px-4 py-3 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400"
              id="withdraw-address"
              name="address"
              placeholder="Enter your USDT wallet address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-400">
            Verify your wallet address matches the selected network.
          </p>
        </div>

        <button
          className="w-full rounded-2xl bg-indigo-600 py-3.5 text-sm font-black text-white transition hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
          type="submit"
          disabled={submitting || !amount || !address}
        >
          {submitting ? "Processing Request..." : "Withdraw Now"}
        </button>
      </form>

      <div className="mt-6 bg-slate-50 rounded-2xl p-4 text-slate-500 text-xs leading-relaxed space-y-2 border">
        <p className="font-bold text-slate-700">Important Reminders:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Withdrawals are processed manually after auditing. Approvals can take up to 24 hours.</li>
          <li>Make sure to double check your address. Transfers are permanent and cannot be reversed.</li>
          <li>USDT withdrawal fees will be automatically deducted based on the selected network block fee.</li>
        </ul>
      </div>
    </section>
  );
}
