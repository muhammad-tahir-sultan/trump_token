import { logoutAction } from "@/features/auth/actions/auth-actions";
import type { AuthenticatedUser } from "@/features/auth/types/auth";

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
    <header className="flex flex-col gap-4 border-b border-slate-200/80 bg-white px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-400">Hello, {user.name}</p>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
          <h2 className="text-2xl font-black tracking-tight text-slate-950">
            Level Commission Dashboard
          </h2>
          <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
            Referral: {user.referralCode}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="sr-only" htmlFor="dashboard-search">
          Search levels
        </label>
        <input
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 sm:w-72"
          id="dashboard-search"
          placeholder="Search levels"
          type="search"
        />
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-slate-950 text-sm font-black text-white">
          {getInitials(user.name)}
        </div>
        <form action={logoutAction} className="lg:hidden">
          <button
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600"
            type="submit"
          >
            Logout
          </button>
        </form>
      </div>
    </header>
  );
}
