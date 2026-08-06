import { levels } from "@/features/levels/data/levels";
import type { Level } from "@/features/levels/types/level";

export type CommissionPreview = {
  eligibleLevel: Level | null;
  amountCents: number;
  baseAmountCents: number;
  rate: number;
};

export const DAILY_DEPOSIT_COMMISSION_RATE = 5;

export function getTodayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function getEligibleLevel(balanceCents: number) {
  return levels
    .filter((level) => balanceCents >= level.minimumDepositCents)
    .at(-1) ?? null;
}

export function getCommissionPreview(totalDepositedCents: number): CommissionPreview {
  const eligibleLevel = getEligibleLevel(totalDepositedCents);

  if (totalDepositedCents <= 0) {
    return {
      amountCents: 0,
      baseAmountCents: 0,
      eligibleLevel: null,
      rate: 0,
    };
  }

  return {
    amountCents: Math.floor(
      (totalDepositedCents * DAILY_DEPOSIT_COMMISSION_RATE) / 100,
    ),
    baseAmountCents: totalDepositedCents,
    eligibleLevel,
    rate: DAILY_DEPOSIT_COMMISSION_RATE,
  };
}
