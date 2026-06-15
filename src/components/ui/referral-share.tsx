"use client";

import { useState } from "react";
import { Toast } from "@/components/ui/toast";

type ReferralShareProps = {
  referralCode: string;
  compact?: boolean;
};

export function ReferralShare({ referralCode, compact = false }: ReferralShareProps) {
  const [toast, setToast] = useState("");

  const referralLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/signup?ref=${encodeURIComponent(referralCode)}`
      : `/signup?ref=${encodeURIComponent(referralCode)}`;

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setToast(`${label} copied!`);
    } catch {
      setToast("Copy failed. Please try again.");
    }
  }

  if (compact) {
    return (
      <>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
            {referralCode}
          </span>
          <button
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-black text-slate-600 transition hover:bg-slate-50"
            onClick={() => copyText(referralCode, "Referral code")}
            type="button"
          >
            Copy Code
          </button>
          <button
            className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700 transition hover:bg-indigo-100"
            onClick={() => copyText(referralLink, "Referral link")}
            type="button"
          >
            Copy Link
          </button>
        </div>
        {toast ? <Toast message={toast} onDone={() => setToast("")} /> : null}
      </>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
          Referral Code
        </p>
        <p className="mt-1 text-xl font-black text-slate-950">{referralCode}</p>
        <p className="mt-3 break-all text-xs font-semibold text-slate-500">{referralLink}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white transition hover:bg-indigo-700"
            onClick={() => copyText(referralCode, "Referral code")}
            type="button"
          >
            Copy Code
          </button>
          <button
            className="rounded-xl border border-indigo-200 bg-white px-4 py-2 text-xs font-black text-indigo-700 transition hover:bg-indigo-50"
            onClick={() => copyText(referralLink, "Referral link")}
            type="button"
          >
            Copy Invite Link
          </button>
        </div>
      </div>
      {toast ? <Toast message={toast} onDone={() => setToast("")} /> : null}
    </>
  );
}
