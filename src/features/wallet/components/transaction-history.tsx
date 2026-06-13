import { formatCurrency } from "@/features/wallet/services/currency";
import type { WalletTransaction } from "@/features/wallet/types/wallet";

type TransactionHistoryProps = {
  transactions: WalletTransaction[];
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-500">
            History
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Deposits & Withdrawals
          </h2>
        </div>
        <a className="text-sm font-black text-indigo-600" href="/deposit">
          New deposit
        </a>
      </div>

      {transactions.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-slate-50 p-6 text-sm font-semibold text-slate-500">
          No wallet transactions yet.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                <th className="py-3 pr-4">Type</th>
                <th className="py-3 pr-4">Amount</th>
                <th className="py-3 pr-4">Balance After</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => {
                const isDeposit = transaction.type === "deposit";

                return (
                  <tr
                    className="border-b border-slate-100 last:border-0"
                    key={transaction.id}
                  >
                    <td className="py-4 pr-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          isDeposit
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {isDeposit ? "Deposit" : "Withdrawal"}
                      </span>
                    </td>
                    <td className="py-4 pr-4 font-black text-slate-950">
                      {isDeposit ? "+" : "-"}
                      {formatCurrency(transaction.amountCents)}
                    </td>
                    <td className="py-4 pr-4 font-bold text-slate-700">
                      {formatCurrency(transaction.balanceAfterCents)}
                    </td>
                    <td className="py-4 pr-4 font-bold capitalize text-slate-500">
                      {transaction.status}
                    </td>
                    <td className="py-4 text-slate-500">
                      {formatDate(transaction.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
