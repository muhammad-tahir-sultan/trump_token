export type WalletTransactionType = "deposit" | "withdrawal";

export type WalletTransactionStatus = "completed";

export type WalletTransaction = {
  id: string;
  type: WalletTransactionType;
  amountCents: number;
  status: WalletTransactionStatus;
  balanceAfterCents: number;
  createdAt: Date;
};

export type WalletSummary = {
  balanceCents: number;
  totalDepositedCents: number;
  totalWithdrawnCents: number;
  transactions: WalletTransaction[];
};
