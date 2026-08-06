type AuthShellProps = {
  children: React.ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="grid min-h-screen bg-slate-100 p-4 text-slate-950 lg:grid-cols-[1fr_520px] lg:p-8">
      <section className="relative hidden overflow-hidden rounded-l-[2rem] bg-slate-950 p-10 text-white lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,_rgba(99,102,241,0.55),_transparent_35%),radial-gradient(circle_at_80%_70%,_rgba(236,72,153,0.35),_transparent_30%)]" />
        <div className="relative z-10 flex h-full flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-white text-lg font-black text-indigo-600">
              D
            </div>
            <div>
              <p className="text-sm font-semibold text-indigo-200">
                Dogecoin Network
              </p>
              <h1 className="text-xl font-black">Dogecoin</h1>
            </div>
          </div>

          <div className="max-w-xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-200">
              Secure Access
            </p>
            <h2 className="mt-5 text-5xl font-black leading-tight tracking-tight">
              Manage deposits and daily commission tiers.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-300">
              Sign in to track the level system from starter deposits to the
              highest reward tier.
            </p>
          </div>
        </div>
      </section>

      <section className="grid place-items-center rounded-[2rem] bg-white px-5 py-10 shadow-2xl shadow-slate-300/40 lg:rounded-l-none">
        {children}
      </section>
    </main>
  );
}
