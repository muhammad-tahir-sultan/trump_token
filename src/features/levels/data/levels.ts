import type { Level } from "@/features/levels/types/level";

export const levels: Level[] = [
  {
    id: 1,
    name: "Level 1",
    minimumDepositCents: 10_00,
    minimumDepositLabel: "$10",
    depositRangeLabel: "$10 - $199",
    dailyCommissionRate: 0.5,
    accentColor: "#6d5dfc",
    gradientClassName: "from-indigo-500 via-violet-500 to-fuchsia-500",
  },
  {
    id: 2,
    name: "Level 2",
    minimumDepositCents: 200_00,
    minimumDepositLabel: "$200",
    depositRangeLabel: "$200 - $999",
    dailyCommissionRate: 0.5,
    accentColor: "#18a999",
    gradientClassName: "from-teal-500 via-emerald-500 to-lime-400",
  },
  {
    id: 3,
    name: "Level 3",
    minimumDepositCents: 1_000_00,
    minimumDepositLabel: "$1,000",
    depositRangeLabel: "$1,000+",
    dailyCommissionRate: 0.5,
    accentColor: "#f59e0b",
    gradientClassName: "from-amber-400 via-orange-500 to-rose-500",
  },
];

export const featuredLevel = levels[2];
