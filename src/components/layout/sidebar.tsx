import { logoutAction } from "@/features/auth/actions/auth-actions";

const navigationItems = [
  { href: "/", label: "Dashboard" },
  { href: "/deposit", label: "Deposit" },
  { href: "/withdraw", label: "Withdraw" },
  { href: "/history", label: "History" },
  { href: "/profile", label: "Profile" },
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200/80 bg-white px-6 py-8 lg:block">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-indigo-600 text-lg font-black text-white">
            L
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-400">
              Level&apos;s Market
            </p>
            <h1 className="text-lg font-black tracking-tight text-slate-950">
              Reward Hub
            </h1>
          </div>
        </div>

        <nav className="mt-10 space-y-2" aria-label="Main navigation">
          {navigationItems.map((item, index) => (
            <a
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                index === 0
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
              href={item.href}
              key={item.href}
            >
              <span className="size-2 rounded-full bg-current" />
              {item.label}
            </a>
          ))}
        </nav>

        <form action={logoutAction} className="mt-auto">
          <button
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-black text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            type="submit"
          >
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
