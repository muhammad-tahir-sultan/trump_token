import { levels } from "@/features/levels/data/levels";
import type { Level } from "@/features/levels/types/level";

export function getLevelById(id: number): Level | null {
  return levels.find((level) => level.id === id) ?? null;
}

export function getQuickAmountsForLevel(level: Level) {
  const minimum = level.minimumDepositCents / 100;
  const suggestions = [
    minimum,
    minimum * 2,
    minimum * 5,
    minimum * 10,
  ].map((value) => Math.round(value));

  return [...new Set(suggestions)].slice(0, 4);
}
