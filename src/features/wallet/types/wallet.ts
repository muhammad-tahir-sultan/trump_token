export type WalletTransactionType =
  | "daily_commission"
  | "deposit"
  | "referral_bonus"
  | "withdrawal";

export type WalletTransactionStatus =
  | "pending"
  | "completed"
  | "rejected"
  | "failed";

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
  depositAddress?: string;
  withdrawAddress?: string;
  withdrawNetwork?: string;
  screenshotUrl?: string;
  adminRemark?: string;
  updatedAt?: Date;
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
