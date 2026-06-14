"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { logoutAction } from "@/features/auth/actions/auth-actions";
import type { AuthenticatedUser } from "@/features/auth/types/auth";

type MobileNavbarProps = {
  user: AuthenticatedUser | null;
};

export function MobileNavbar({ user }: MobileNavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navigationItems = [
    { href: "/", label: "Dashboard" },
    { href: "/deposit", label: "Deposit" },
    { href: "/withdraw", label: "Withdraw" },
    { href: "/commission", label: "Commission" },
    { href: "/team", label: "Team" },
    { href: "/history", label: "History" },
    { href: "/profile", label: "Profile" },
    { href: "/support", label: "Support" },
  ];

  if (user?.role === "admin") {
    navigationItems.push({ href: "/admin", label: "Admin Panel" });
  }

  return (
    <>
      {/* Mobile Top Navbar Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-5 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-sm font-black text-white">
            R
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">
              Rivochain Network
            </p>
            <h1 className="text-sm font-black tracking-tight text-slate-950">
              Rivochain
            </h1>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 active:scale-95"
          aria-label="Open navigation menu"
        >
          <svg
            className="size-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </header>

      {/* Navigation Overlay & Drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop blur overlay */}
        <div
          className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />

        {/* Sliding Menu Panel */}
        <div
          className={`absolute inset-x-0 top-0 flex flex-col bg-white px-6 py-6 shadow-2xl rounded-b-[2rem] border-b border-slate-200/80 transition-all duration-300 ease-out transform ${
            isOpen ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          {/* Menu Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-sm font-black text-white">
                R
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">
                  Rivochain Network
                </p>
                <h1 className="text-sm font-black tracking-tight text-slate-950">
                  Rivochain
                </h1>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 active:scale-95"
              aria-label="Close menu"
            >
              <svg
                className="size-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-8 space-y-1.5" aria-label="Mobile navigation">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-base font-bold transition ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  href={item.href}
                  key={item.href}
                  onClick={() => setIsOpen(false)}
                >
                  <span className="size-2 rounded-full bg-current" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <form action={logoutAction} className="mt-8">
            <button
              className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-center text-base font-black text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-98"
              type="submit"
            >
              Logout
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
