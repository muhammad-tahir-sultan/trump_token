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
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-500">
              Team
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Referral Team
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Jo user aapke referral code se join karega woh yahan team member
              ban kar show hoga. Uski deposits par aapko 1% bonus milega.
            </p>
          </div>
          <div className="rounded-3xl bg-slate-950 px-5 py-4 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Your Code
            </p>
            <p className="mt-1 text-2xl font-black">{referralCode}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-sm font-bold text-slate-400">Team Members</p>
            <p className="mt-2 text-2xl font-black text-slate-950">
              {team.totalMembers}
            </p>
          </div>
          <div className="rounded-3xl bg-emerald-50 p-5">
            <p className="text-sm font-bold text-emerald-700">Team Deposits</p>
            <p className="mt-2 text-2xl font-black text-emerald-700">
              {formatCurrency(team.totalDepositedCents)}
            </p>
          </div>
          <div className="rounded-3xl bg-amber-50 p-5">
            <p className="text-sm font-bold text-amber-700">Team Withdrawals</p>
            <p className="mt-2 text-2xl font-black text-amber-700">
              {formatCurrency(team.totalWithdrawnCents)}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-black text-slate-950">Team Members</h3>
        {team.members.length === 0 ? (
          <div className="mt-5 rounded-3xl bg-slate-50 p-6 text-sm font-semibold text-slate-500">
            Abhi aapke referral code se koi user join nahi hua.
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
