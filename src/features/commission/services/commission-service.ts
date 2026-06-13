import { levels } from "@/features/levels/data/levels";
import type { Level } from "@/features/levels/types/level";

export type CommissionPreview = {
  eligibleLevel: Level | null;
  amountCents: number;
  rate: number;
};

export function getTodayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function getEligibleLevel(balanceCents: number) {
  return levels
    .filter((level) => balanceCents >= level.minimumDepositCents)
    .at(-1) ?? null;
}

export function getCommissionPreview(balanceCents: number): CommissionPreview {
  const eligibleLevel = getEligibleLevel(balanceCents);

  if (!eligibleLevel) {
    return {
      amountCents: 0,
      eligibleLevel: null,
      rate: 0,
    };
  }

  return {
    amountCents: Math.floor(
      (balanceCents * eligibleLevel.dailyCommissionRate) / 100,
    ),
    eligibleLevel,
    rate: eligibleLevel.dailyCommissionRate,
  };
}
