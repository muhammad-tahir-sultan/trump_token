import { ReferralShare } from "@/components/ui/referral-share";
import { StatCard } from "@/components/ui/stat-card";
import { formatCurrency } from "@/features/wallet/services/currency";
import type { TeamSummary } from "@/features/team/types/team";

type TeamOverviewProps = {
  referralCode: string;
  team: TeamSummary;
};

const teamRoles = [
  {
    name: "Leader",
    salaryCents: 100_00,
    requiredMembers: 20,
    requiredDepositCents: 10_000_00,
  },
  {
    name: "Manager",
    salaryCents: 300_00,
    requiredMembers: 50,
    requiredDepositCents: 350_000_00,
  },
  {
    name: "Senior Manager",
    salaryCents: 500_00,
    requiredMembers: 80,
    requiredDepositCents: 70_000_00,
  },
  {
    name: "Director",
    salaryCents: 1_000_00,
    requiredMembers: 150,
    requiredDepositCents: 150_000_00,
  },
];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(date));
}

function getRoleProgress(
  requiredMembers: number,
  requiredDepositCents: number,
  team: TeamSummary,
) {
  const memberProgress = Math.min((team.totalMembers / requiredMembers) * 100, 100);
  const depositProgress = Math.min(
    (team.totalDepositedCents / requiredDepositCents) * 100,
    100,
  );

  return Math.floor(Math.min(memberProgress, depositProgress));
}

export function TeamOverview({ referralCode, team }: TeamOverviewProps) {
  const statItems = [
    {
      label: "Total Team Members",
      value: String(team.totalMembers),
      trend: "Members",
    },
    {
      label: "Team Total Deposit",
      value: formatCurrency(team.totalDepositedCents),
      trend: "All time",
    },
    {
      label: "Team Total Withdrawal",
      value: formatCurrency(team.totalWithdrawnCents),
      trend: "All time",
    },
    {
      label: "Team Total Balance",
      value: formatCurrency(team.totalBalanceCents),
      trend: "Live",
    },
    {
      label: "Today Team Deposit",
      value: formatCurrency(team.todayDepositedCents),
      trend: "Today",
    },
    {
      label: "Today Team Withdrawal",
      value: formatCurrency(team.todayWithdrawnCents),
      trend: "Today",
    },
    {
      label: "Today Team Commission",
      value: formatCurrency(team.todayTeamCommissionCents),
      trend: "Today",
    },
    {
      label: "Total Team Commission",
      value: formatCurrency(team.totalTeamCommissionCents),
      trend: "Earned",
    },
  ];

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

        <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-4">
          {statItems.map((item) => (
            <StatCard
              key={item.label}
              label={item.label}
              trend={item.trend}
              value={item.value}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 sm:text-sm">
              Team Roles
            </p>
            <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
              Role Salary Progress
            </h3>
          </div>
          <p className="text-xs font-bold text-slate-500 sm:text-sm">
            Team deposit: {formatCurrency(team.totalDepositedCents)}
          </p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {teamRoles.map((role) => {
            const progress = getRoleProgress(
              role.requiredMembers,
              role.requiredDepositCents,
              team,
            );
            const remainingDepositCents = Math.max(
              role.requiredDepositCents - team.totalDepositedCents,
              0,
            );
            const remainingMembers = Math.max(
              role.requiredMembers - team.totalMembers,
              0,
            );
            const achieved = progress === 100;

            return (
              <article
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                key={role.name}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-slate-950">{role.name}</p>
                    <p className="mt-1 text-sm font-bold text-emerald-700">
                      {formatCurrency(role.salaryCents)} salary per month
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      achieved
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-white text-slate-500"
                    }`}
                  >
                    {achieved ? "Unlocked" : `${progress}%`}
                  </span>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="font-bold text-slate-400">Required Team</p>
                    <p className="mt-1 font-black text-slate-950">
                      {role.requiredMembers} persons
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-400">Remaining Team</p>
                    <p className="mt-1 font-black text-slate-950">
                      {remainingMembers} persons
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-400">Current Amount</p>
                    <p className="mt-1 font-black text-slate-950">
                      {formatCurrency(team.totalDepositedCents)}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-400">Total Required</p>
                    <p className="mt-1 font-black text-slate-950">
                      {formatCurrency(role.requiredDepositCents)}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-400">Remaining Amount</p>
                    <p className="mt-1 font-black text-slate-950">
                      {formatCurrency(remainingDepositCents)}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
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
