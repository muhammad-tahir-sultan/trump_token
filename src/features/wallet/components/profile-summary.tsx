import type { AuthenticatedUser } from "@/features/auth/types/auth";
import { formatCurrency } from "@/features/wallet/services/currency";
import type { WalletSummary } from "@/features/wallet/types/wallet";

type ProfileSummaryProps = {
  user: AuthenticatedUser;
  wallet: WalletSummary;
};

const profileRows = [
  ["Name", "name"],
  ["Email", "email"],
  ["Role", "role"],
  ["Referral Code", "referralCode"],
] as const;

export function ProfileSummary({ user, wallet }: ProfileSummaryProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-500">
          Profile
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          Account Details
        </h2>

        <div className="mt-6 divide-y divide-slate-100 rounded-3xl border border-slate-100">
          {profileRows.map(([label, key]) => (
            <div
              className="grid gap-1 px-5 py-4 sm:grid-cols-[180px_1fr] sm:items-center"
              key={key}
            >
              <p className="text-sm font-bold text-slate-400">{label}</p>
              <p className="font-black text-slate-950">{user[key]}</p>
            </div>
          ))}
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">
            Wallet Balance
          </p>
          <p className="mt-3 text-4xl font-black">
            {formatCurrency(wallet.balanceCents)}
          </p>
        </div>
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-slate-400">Total Deposited</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">
            {formatCurrency(wallet.totalDepositedCents)}
          </p>
        </div>
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-slate-400">Total Withdrawn</p>
          <p className="mt-2 text-2xl font-black text-amber-600">
            {formatCurrency(wallet.totalWithdrawnCents)}
          </p>
        </div>
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-slate-400">Referral Bonus</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">
            {formatCurrency(wallet.totalReferralBonusCents)}
          </p>
        </div>
        <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-slate-400">Daily Commission</p>
          <p className="mt-2 text-2xl font-black text-indigo-600">
            {formatCurrency(wallet.totalCommissionCents)}
          </p>
        </div>
      </aside>
    </div>
  );
}
