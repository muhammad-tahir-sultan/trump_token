export type WalletTransactionType =
  | "daily_commission"
  | "deposit"
  | "referral_bonus"
  | "withdrawal";

export type WalletTransactionStatus = "completed";

export type WalletTransaction = {
  id: string;
  type: WalletTransactionType;
  amountCents: number;
  status: WalletTransactionStatus;
  balanceAfterCents: number;
  createdAt: Date;
  description?: string;
  sourceUserId?: string;
  sourceUserName?: string;
};

export type WalletSummary = {
  balanceCents: number;
  lastCommissionClaimedDate: string | null;
  totalCommissionCents: number;
  totalDepositedCents: number;
  totalReferralBonusCents: number;
  totalWithdrawnCents: number;
  transactions: WalletTransaction[];
};
