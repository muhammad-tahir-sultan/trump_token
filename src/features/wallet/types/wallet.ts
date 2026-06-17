export type WalletTransactionType =
  | "daily_commission"
  | "deposit"
  | "referral_bonus"
  | "referral_first_day_commission"
  | "referral_daily_commission"
  | "withdrawal";

export type WalletTransactionStatus = "completed" | "pending" | "rejected";

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
};

export type WalletSummary = {
  balanceCents: number;
  commissionUnlockAt: string | null;
  lastCommissionClaimedDate: string | null;
  lastReferralCommissionClaimedDate: string | null;
  totalCommissionCents: number;
  totalDepositedCents: number;
  totalReferralBonusCents: number;
  totalWithdrawnCents: number;
  transactions: WalletTransaction[];
};
