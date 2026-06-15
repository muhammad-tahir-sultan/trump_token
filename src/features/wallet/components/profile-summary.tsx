import { logoutAction } from "@/features/auth/actions/auth-actions";
import type { AuthenticatedUser } from "@/features/auth/types/auth";
import { ReferralShare } from "@/components/ui/referral-share";
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
] as const;

export function ProfileSummary({ user, wallet }: ProfileSummaryProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px] xl:gap-6">
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-500 sm:text-sm">
          Profile
        </p>
        <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 sm:mt-2 sm:text-3xl">
          Account Details
        </h2>

        <div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-100 sm:mt-6 sm:rounded-3xl">
          {profileRows.map(([label, key]) => (
            <div
              className="grid gap-1 px-4 py-3 sm:grid-cols-[140px_1fr] sm:items-center sm:px-5 sm:py-4"
              key={key}
            >
              <p className="text-xs font-bold text-slate-400 sm:text-sm">{label}</p>
              <p className="text-sm font-black text-slate-950 sm:text-base">{user[key]}</p>
            </div>
          ))}
          <div className="px-4 py-3 sm:px-5 sm:py-4">
            <p className="text-xs font-bold text-slate-400 sm:text-sm">Referral</p>
            <div className="mt-2">
              <ReferralShare referralCode={user.referralCode} />
            </div>
          </div>
        </div>

        <form action={logoutAction} className="mt-4 lg:hidden">
          <button
            className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-600 transition hover:bg-rose-100"
            type="submit"
          >
            Logout
          </button>
        </form>
      </section>

      <aside className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-1">
        <div className="col-span-2 rounded-2xl bg-slate-950 p-4 text-white shadow-sm sm:rounded-[2rem] sm:p-6 xl:col-span-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 sm:text-sm">
            Wallet Balance
          </p>
          <p className="mt-2 text-2xl font-black sm:mt-3 sm:text-4xl">
            {formatCurrency(wallet.balanceCents)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:rounded-[2rem] sm:p-5">
          <p className="text-[10px] font-bold text-slate-400 sm:text-sm">Deposited</p>
          <p className="mt-1 text-lg font-black text-emerald-600 sm:mt-2 sm:text-2xl">
            {formatCurrency(wallet.totalDepositedCents)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:rounded-[2rem] sm:p-5">
          <p className="text-[10px] font-bold text-slate-400 sm:text-sm">Withdrawn</p>
          <p className="mt-1 text-lg font-black text-amber-600 sm:mt-2 sm:text-2xl">
            {formatCurrency(wallet.totalWithdrawnCents)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:rounded-[2rem] sm:p-5">
          <p className="text-[10px] font-bold text-slate-400 sm:text-sm">Referral Bonus</p>
          <p className="mt-1 text-lg font-black text-emerald-600 sm:mt-2 sm:text-2xl">
            {formatCurrency(wallet.totalReferralBonusCents)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:rounded-[2rem] sm:p-5">
          <p className="text-[10px] font-bold text-slate-400 sm:text-sm">Commission</p>
          <p className="mt-1 text-lg font-black text-indigo-600 sm:mt-2 sm:text-2xl">
            {formatCurrency(wallet.totalCommissionCents)}
          </p>
        </div>
      </aside>
    </div>
  );
}
