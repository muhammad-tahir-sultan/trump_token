export function formatCurrency(cents: number | undefined | null) {
  const value = cents ?? 0;
  const dollars = Number.isFinite(value) ? value / 100 : 0;

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(dollars);
}
