import Link from "next/link";

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
}: AuthFormProps) {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 lg:hidden">
        <div className="grid size-12 place-items-center rounded-2xl bg-indigo-600 text-lg font-black text-white">
          L
        </div>
      </div>

      <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-500">
        Reward Hub
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
              placeholder="Tahir Khan"
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
          <input
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            id="password"
            minLength={mode === "signup" ? 8 : undefined}
            name="password"
            placeholder="Minimum 8 characters"
            required
            type="password"
          />
        </div>

        <button
          className="w-full rounded-2xl bg-indigo-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200"
          type="submit"
        >
          {buttonLabel}
        </button>
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
