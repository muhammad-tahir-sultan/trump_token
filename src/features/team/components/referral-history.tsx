import { formatCurrency } from "@/features/wallet/services/currency";
import type { TeamSummary } from "@/features/team/types/team";

type ReferralHistoryProps = {
  team: TeamSummary;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(date));
}

export function ReferralHistory({ team }: ReferralHistoryProps) {
  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-500">
            Referrals
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Referral Join History
          </h2>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
          {team.totalMembers} members
        </span>
      </div>

      {team.members.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-slate-50 p-6 text-sm font-semibold text-slate-500">
          No users have joined through your referral code yet.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                <th className="py-3 pr-4">Joined User</th>
                <th className="py-3 pr-4">Joined On</th>
                <th className="py-3 pr-4">Deposits</th>
                <th className="py-3 pr-4">Withdrawals</th>
                <th className="py-3">Current Balance</th>
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
  );
}
