// Parses a user-typed string into a whole number of satoshis.
// Throws if the input is not a positive integer.
export function parseSats(input: string): number {
  const trimmed = input.trim();

  if (!/^\d+$/.test(trimmed)) {
    throw new Error("Amount must be a whole number (no decimals or letters)");
  }

  const value = parseInt(trimmed, 10);

  if (value <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  if (value > 21_000_000 * 100_000_000) {
    throw new Error("Amount exceeds maximum supply of Bitcoin");
  }

  return value;
}
