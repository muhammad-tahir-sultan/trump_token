import { levels } from "@/features/levels/data/levels";
import type { Level } from "@/features/levels/types/level";

export type CommissionPreview = {
  eligibleLevel: Level | null;
  amountCents: number;
  baseAmountCents: number;
  rate: number;
};

export const dailyDepositCommissionTiers = [
  {
    label: "$10 - $199",
    maximumDepositCents: 199_99,
    minimumDepositCents: 10_00,
    rate: 2,
  },
  {
    label: "$200 - $999",
    maximumDepositCents: 999_99,
    minimumDepositCents: 200_00,
    rate: 3.5,
  },
  {
    label: "$1,000+",
    maximumDepositCents: null,
    minimumDepositCents: 1_000_00,
    rate: 5,
  },
] as const;

export function getTodayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function getEligibleLevel(balanceCents: number) {
  return levels
    .filter((level) => balanceCents >= level.minimumDepositCents)
    .at(-1) ?? null;
}

export function getDailyDepositCommissionRate(totalDepositedCents: number) {
  return (
    dailyDepositCommissionTiers.find(
      (tier) =>
        totalDepositedCents >= tier.minimumDepositCents &&
        (tier.maximumDepositCents === null ||
          totalDepositedCents <= tier.maximumDepositCents),
    )?.rate ?? 0
  );
}

export function getCommissionPreview(totalDepositedCents: number): CommissionPreview {
  const eligibleLevel = getEligibleLevel(totalDepositedCents);
  const rate = getDailyDepositCommissionRate(totalDepositedCents);

  if (rate <= 0) {
    return {
      amountCents: 0,
      baseAmountCents: 0,
      eligibleLevel: null,
      rate: 0,
    };
  }

  return {
    amountCents: Math.floor(
      (totalDepositedCents * rate) / 100,
    ),
    baseAmountCents: totalDepositedCents,
    eligibleLevel,
    rate,
  };
}
