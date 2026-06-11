import type { Level } from "@/features/levels/types/level";

export const levels: Level[] = [
  {
    id: 1,
    name: "Level 1",
    minimumDepositLabel: "$10",
    depositRangeLabel: "$10+",
    dailyCommissionRate: 5,
    accentColor: "#6d5dfc",
    gradientClassName: "from-indigo-500 via-violet-500 to-fuchsia-500",
  },
  {
    id: 2,
    name: "Level 2",
    minimumDepositLabel: "$100",
    depositRangeLabel: "$100+",
    dailyCommissionRate: 6,
    accentColor: "#18a999",
    gradientClassName: "from-teal-500 via-emerald-500 to-lime-400",
  },
  {
    id: 3,
    name: "Level 3",
    minimumDepositLabel: "$200",
    depositRangeLabel: "$200 - $500",
    dailyCommissionRate: 7,
    accentColor: "#f59e0b",
    gradientClassName: "from-amber-400 via-orange-500 to-rose-500",
  },
  {
    id: 4,
    name: "Level 4",
    minimumDepositLabel: "$500",
    depositRangeLabel: "$500 - $2,000",
    dailyCommissionRate: 9,
    accentColor: "#2563eb",
    gradientClassName: "from-blue-500 via-sky-500 to-cyan-400",
  },
  {
    id: 5,
    name: "Level 5",
    minimumDepositLabel: "$2,000+",
    depositRangeLabel: "Above $2,000",
    dailyCommissionRate: 12,
    accentColor: "#ec4899",
    gradientClassName: "from-pink-500 via-rose-500 to-red-500",
  },
];

export const featuredLevel = levels[4];
