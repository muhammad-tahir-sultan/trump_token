import type { AuthenticatedUser } from "@/features/auth/types/auth";
import { ReferralShare } from "@/components/ui/referral-share";

type DashboardHeaderProps = {
  user: AuthenticatedUser;
};

function getInitials(name: string | undefined) {
  const safeName = name ?? "";
  return safeName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-950 px-3 py-4 sm:px-5 sm:py-5 lg:px-8">
      <div className="lg:flex lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 sm:text-sm">
            Hello, {user.name}
          </p>
          <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950 sm:text-2xl">
            Level Commission Dashboard
          </h2>
          <div className="mt-2">
            <ReferralShare compact referralCode={user.referralCode} />
          </div>
        </div>

        {/* Desktop only — no search, avatar, or logout on mobile */}
        <div className="mt-0 hidden lg:block">
          <div className="grid size-12 place-items-center rounded-2xl bg-slate-950 text-sm font-black text-white">
            {getInitials(user.name)}
          </div>
        </div>
      </div>
    </header>
  );
}
