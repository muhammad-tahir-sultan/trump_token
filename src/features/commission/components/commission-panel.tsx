import { claimDailyCommissionAction } from "@/features/commission/actions/commission-actions";
import { getTodayKey } from "@/features/commission/services/commission-service";
import { formatCurrency } from "@/features/wallet/services/currency";
import type { WalletSummary } from "@/features/wallet/types/wallet";

type CommissionPanelProps = {
  error?: string;
  preview: {
    amountCents: number;
    eligibleLevel: {
      name: string;
    } | null;
    rate: number;
  };
  success?: string;
  wallet: WalletSummary;
};

export function CommissionPanel({
  error,
  preview,
  success,
  wallet,
}: CommissionPanelProps) {
  const alreadyClaimed = wallet.lastCommissionClaimedDate === getTodayKey();
  const canClaim = preview.amountCents > 0 && !alreadyClaimed;

  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-500">
            Daily Commission
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Claim Existing Balance Commission
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Daily commission is calculated based on your current wallet balance
            tier. After each approved deposit, commission unlocks after 24 hours.
            You can claim commission once per day.
          </p>
        </div>
        <div className="rounded-3xl bg-slate-950 px-5 py-4 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Wallet Balance
          </p>
          <p className="mt-1 text-2xl font-black">
            {formatCurrency(wallet.balanceCents)}
          </p>
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

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl bg-slate-50 p-5">
          <p className="text-sm font-bold text-slate-400">Eligible Level</p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {preview.eligibleLevel?.name ?? "Not eligible"}
          </p>
        </div>
        <div className="rounded-3xl bg-indigo-50 p-5">
          <p className="text-sm font-bold text-indigo-700">Daily Rate</p>
          <p className="mt-2 text-2xl font-black text-indigo-700">
            {preview.rate}%
          </p>
        </div>
        <div className="rounded-3xl bg-emerald-50 p-5">
          <p className="text-sm font-bold text-emerald-700">Today&apos;s Amount</p>
          <p className="mt-2 text-2xl font-black text-emerald-700">
            {formatCurrency(preview.amountCents)}
          </p>
        </div>
      </div>

      <form action={claimDailyCommissionAction} className="mt-6">
        <button
          className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={!canClaim}
          type="submit"
        >
          {alreadyClaimed ? "Already Claimed Today" : "Claim Daily Commission"}
        </button>
      </form>
    </section>
  );
}
