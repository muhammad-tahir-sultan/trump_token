import { formatCurrency } from "@/features/wallet/services/currency";

type WalletFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  balanceCents: number;
  error?: string;
  kind: "deposit" | "withdraw";
  success?: string;
};

export function WalletForm({
  action,
  balanceCents,
  error,
  kind,
  success,
}: WalletFormProps) {
  const isDeposit = kind === "deposit";
  const title = isDeposit ? "Deposit Funds" : "Withdraw Funds";
  const description = isDeposit
    ? "Add funds to your wallet and unlock level rewards."
    : "Withdraw available balance from your wallet.";

  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-500">
            Wallet
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        </div>
        <div className="rounded-3xl bg-slate-950 px-5 py-4 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Balance
          </p>
          <p className="mt-1 text-2xl font-black">{formatCurrency(balanceCents)}</p>
        </div>
      </div>

      {error ? (
        <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {success}
        </p>
      ) : null}

      <form action={action} className="mt-6 grid gap-5">
        <div>
          <label
            className="text-sm font-black text-slate-700"
            htmlFor={`${kind}-amount`}
          >
            Amount
          </label>
          <div className="mt-2 flex rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100">
            <span className="grid w-12 place-items-center border-r border-slate-200 text-sm font-black text-slate-500">
              $
            </span>
            <input
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400"
              id={`${kind}-amount`}
              min={isDeposit ? "10" : "1"}
              name="amount"
              placeholder={isDeposit ? "10.00" : "1.00"}
              step="0.01"
              type="number"
            />
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-400">
            {isDeposit ? "Minimum deposit is $10.00." : "Withdrawals cannot exceed your balance."}
          </p>
        </div>

        <button
          className="w-fit rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-700"
          type="submit"
        >
          {isDeposit ? "Deposit Now" : "Withdraw Now"}
        </button>
      </form>
    </section>
  );
}
