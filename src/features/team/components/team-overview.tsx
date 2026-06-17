import { ReferralShare } from "@/components/ui/referral-share";
import { formatCurrency } from "@/features/wallet/services/currency";
import type { TeamSummary } from "@/features/team/types/team";

type TeamOverviewProps = {
  referralCode: string;
  team: TeamSummary;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(date));
}

export function TeamOverview({ referralCode, team }: TeamOverviewProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-500 sm:text-sm">
              Team
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 sm:mt-2 sm:text-3xl">
              Referral Team
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500 sm:mt-2 sm:text-sm sm:leading-6">
              Users who join with your referral code appear here as team members.
              You receive the full level commission rate on the first day of their
              approved deposit, then you can claim 1% daily on your team balance.
            </p>
          </div>
          <ReferralShare referralCode={referralCode} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-3 sm:rounded-3xl sm:p-5">
            <p className="text-xs font-bold text-slate-400 sm:text-sm">Team Members</p>
            <p className="mt-1 text-lg font-black text-slate-950 sm:mt-2 sm:text-2xl">
              {team.totalMembers}
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-3 sm:rounded-3xl sm:p-5">
            <p className="text-xs font-bold text-emerald-700 sm:text-sm">Team Deposits</p>
            <p className="mt-1 text-lg font-black text-emerald-700 sm:mt-2 sm:text-2xl">
              {formatCurrency(team.totalDepositedCents)}
            </p>
          </div>
          <div className="col-span-2 rounded-2xl bg-amber-50 p-3 sm:col-span-1 sm:rounded-3xl sm:p-5">
            <p className="text-xs font-bold text-amber-700 sm:text-sm">Team Withdrawals</p>
            <p className="mt-1 text-lg font-black text-amber-700 sm:mt-2 sm:text-2xl">
              {formatCurrency(team.totalWithdrawnCents)}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6">
        <h3 className="text-lg font-black text-slate-950 sm:text-xl">Team Members</h3>
        {team.members.length === 0 ? (
          <div className="mt-5 rounded-3xl bg-slate-50 p-6 text-sm font-semibold text-slate-500">
            No users have joined with your referral code yet.
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  <th className="py-3 pr-4">Member</th>
                  <th className="py-3 pr-4">Joined</th>
                  <th className="py-3 pr-4">Deposited</th>
                  <th className="py-3 pr-4">Withdrawn</th>
                  <th className="py-3">Balance</th>
                </tr>
              </thead>
              <tbody>
                {team.members.map((member) => (
                  <tr
                    className="border-b border-slate-100 last:border-0"
                    key={member.id}
                  >
                    <td className="py-4 pr-4">
                      <p className="font-black text-slate-950">{member.name}</p>
                      <p className="text-xs font-semibold text-slate-400">
                        {member.email}
                      </p>
                    </td>
                    <td className="py-4 pr-4 text-slate-500">
                      {formatDate(member.createdAt)}
                    </td>
                    <td className="py-4 pr-4 font-bold text-emerald-600">
                      {formatCurrency(member.totalDepositedCents)}
                    </td>
                    <td className="py-4 pr-4 font-bold text-amber-600">
                      {formatCurrency(member.totalWithdrawnCents)}
                    </td>
                    <td className="py-4 font-black text-slate-950">
                      {formatCurrency(member.balanceCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
