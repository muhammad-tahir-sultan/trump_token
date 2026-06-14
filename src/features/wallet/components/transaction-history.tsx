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

function getTransactionLabel(transaction: WalletTransaction) {
  switch (transaction.type) {
    case "daily_commission":
      return "Daily Commission";
    case "deposit":
      return "Deposit";
    case "referral_bonus":
      return "Referral Bonus";
    case "withdrawal":
      return "Withdrawal";
  }
}

function getTransactionClassName(transaction: WalletTransaction) {
  switch (transaction.type) {
    case "deposit":
    case "daily_commission":
    case "referral_bonus":
      return "bg-emerald-50 text-emerald-700";
    case "withdrawal":
      return "bg-amber-50 text-amber-700";
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-700 border border-amber-100";
    case "completed":
      return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    case "rejected":
    case "failed":
      return "bg-rose-50 text-rose-700 border border-rose-100";
    default:
      return "bg-slate-50 text-slate-500 border border-slate-100";
  }
}

function getTransactionDetails(transaction: WalletTransaction) {
  if (transaction.type === "referral_bonus" && transaction.sourceUserName) {
    return `Bonus from ${transaction.sourceUserName}`;
  }
  if (transaction.type === "withdrawal" && transaction.withdrawAddress) {
    const addr = transaction.withdrawAddress;
    const shortAddr = addr.length > 10 ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : addr;
    return `Withdraw to ${shortAddr} (${transaction.withdrawNetwork})`;
  }
  if (transaction.type === "deposit" && transaction.depositAddress) {
    return `Deposit to TRC-20 Address`;
  }

  return transaction.description ?? "Wallet transaction";
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
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                <th className="py-3 pr-4">Type</th>
                <th className="py-3 pr-4">Amount</th>
                <th className="py-3 pr-4">Details</th>
                <th className="py-3 pr-4">Balance After</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => {
                const isWithdrawal = transaction.type === "withdrawal";

                return (
                  <tr
                    className="border-b border-slate-100 last:border-0"
                    key={transaction.id}
                  >
                    <td className="py-4 pr-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${getTransactionClassName(transaction)}`}
                      >
                        {getTransactionLabel(transaction)}
                      </span>
                    </td>
                    <td className="py-4 pr-4 font-black text-slate-950">
                      {isWithdrawal ? "-" : "+"}
                      {formatCurrency(transaction.amountCents)}
                    </td>
                    <td className="py-4 pr-4 text-slate-500">
                      <div>{getTransactionDetails(transaction)}</div>
                      {transaction.screenshotUrl && (
                        <a href={transaction.screenshotUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline font-bold mt-1 inline-block">
                          View Receipt
                        </a>
                      )}
                    </td>
                    <td className="py-4 pr-4 font-bold text-slate-700">
                      {transaction.status === "pending" && isWithdrawal ? (
                        <span className="text-slate-400 italic text-xs font-normal">Pending Approval</span>
                      ) : (
                        formatCurrency(transaction.balanceAfterCents)
                      )}
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${getStatusBadgeClass(transaction.status)}`}>
                        {transaction.status}
                      </span>
                      {transaction.adminRemark && (
                        <p className="text-[10px] text-rose-500 font-bold mt-1 leading-tight max-w-[150px]">
                          Reason: {transaction.adminRemark}
                        </p>
                      )}
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
