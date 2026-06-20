export class InvalidWalletAmountError extends Error {
  constructor(message = "Enter a valid amount.") {
    super(message);
    this.name = "InvalidWalletAmountError";
  }
}

export function isValidTrc20Address(address: string) {
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address.trim());
}

export function getAmountCents(formData: FormData) {
  const rawAmount = String(formData.get("amount") ?? "").trim();

  if (!/^\d+(\.\d{1,2})?$/.test(rawAmount)) {
    throw new InvalidWalletAmountError("Amount must be a positive number.");
  }

  const [dollars, cents = ""] = rawAmount.split(".");
  const amountCents = Number(dollars) * 100 + Number(cents.padEnd(2, "0"));

  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throw new InvalidWalletAmountError("Amount must be greater than zero.");
  }

  if (amountCents > 1_000_000_00) {
    throw new InvalidWalletAmountError("Amount is above the allowed limit.");
  }

  return amountCents;
}
