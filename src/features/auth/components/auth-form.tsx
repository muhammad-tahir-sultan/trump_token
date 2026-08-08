"use client";

import Link from "next/link";
import { useState } from "react";
import { DogecoinLogo } from "@/components/ui/dogecoin-logo";
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button";

type AuthFormProps = {
  action: (formData: FormData) => Promise<void>;
  buttonLabel: string;
  error?: string;
  footerHref: string;
  footerLabel: string;
  footerText: string;
  mode: "login" | "signup";
  subtitle: string;
  title: string;
  defaultReferralCode?: string;
};

export function AuthForm({
  action,
  buttonLabel,
  error,
  footerHref,
  footerLabel,
  footerText,
  mode,
  subtitle,
  title,
  defaultReferralCode = "",
}: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 lg:hidden">
        <DogecoinLogo size={48} />
      </div>

      <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-500">
        Dogecoin
      </p>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">{subtitle}</p>

      {error ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      <form action={action} className="mt-8 space-y-5">
        {mode === "signup" ? (
          <div>
            <label className="text-sm font-bold text-slate-700" htmlFor="name">
              Full name
            </label>
            <input
              autoComplete="name"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              id="name"
              name="name"
              placeholder="Enter Your Name"
              required
              type="text"
            />
          </div>
        ) : null}

        <div>
          <label className="text-sm font-bold text-slate-700" htmlFor="email">
            Email address
          </label>
          <input
            autoComplete="email"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            id="email"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700" htmlFor="password">
            Password
          </label>
          <div className="relative mt-2">
            <input
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm font-semibold outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              id="password"
              minLength={mode === "signup" ? 8 : undefined}
              name="password"
              placeholder="Minimum 8 characters"
              required
              type={showPassword ? "text" : "password"}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 hover:text-slate-700 transition"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L6.228 6.228" />
                </svg>
              ) : (
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.022 7.36 4.5 12 4.5c4.638 0 8.573 2.522 10.964 6.364a1 1 0 010 .639C20.577 16.978 16.64 19.5 12 19.5c-4.638 0-8.573-2.522-10.964-6.364zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {mode === "signup" ? (
          <div>
            <label
              className="text-sm font-bold text-slate-700"
              htmlFor="referralCode"
            >
              Referral code
            </label>
            <input
              autoComplete="off"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold uppercase outline-none transition placeholder:normal-case focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 read-only:cursor-not-allowed read-only:bg-indigo-50/60"
              defaultValue={defaultReferralCode}
              id="referralCode"
              name="referralCode"
              placeholder="Enter sponsor referral code"
              readOnly={Boolean(defaultReferralCode)}
              required
              type="text"
            />
            <p className="mt-2 text-xs font-semibold text-slate-400">
              {defaultReferralCode
                ? "Referral code auto-filled from your invite link."
                : "New users must enter an existing referral code to join."}
            </p>
          </div>
        ) : null}

        <AuthSubmitButton
          label={buttonLabel}
          pendingLabel={mode === "login" ? "Logging in..." : "Creating account..."}
        />
      </form>

      <p className="mt-6 text-center text-sm font-semibold text-slate-500">
        {footerText}{" "}
        <Link className="font-black text-indigo-600" href={footerHref}>
          {footerLabel}
        </Link>
      </p>
    </div>
  );
}
