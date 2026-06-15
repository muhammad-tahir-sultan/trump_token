import type { AuthenticatedUser } from "@/features/auth/types/auth";
import { ReferralShare } from "@/components/ui/referral-share";

type DashboardHeaderProps = {
  user: AuthenticatedUser;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-3 border-b border-slate-200/80 bg-white px-3 py-4 sm:px-5 sm:py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
      <div>
        <p className="text-xs font-semibold text-slate-400 sm:text-sm">Hello, {user.name}</p>
        <div className="mt-1 flex flex-col gap-2">
          <h2 className="text-lg font-black tracking-tight text-slate-950 sm:text-2xl">
            Level Commission Dashboard
          </h2>
          <ReferralShare compact referralCode={user.referralCode} />
        </div>
      </div>

      <div className="hidden items-center gap-3 lg:flex">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-slate-950 text-sm font-black text-white">
          {getInitials(user.name)}
        </div>
      </div>
    </header>
  );
}
