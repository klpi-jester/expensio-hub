// Small, dependency-free formatting helpers shared by server + client code.

/** Format a numeric amount with a currency symbol, e.g. `₱1,234.50`. */
export function formatMoney(
  value: number | string | null | undefined,
  symbol = "₱",
): string {
  const n = typeof value === "string" ? Number.parseFloat(value) : (value ?? 0);
  const safe = Number.isFinite(n) ? n : 0;
  return `${symbol}${safe.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1

/**
 * Generate a short, human-friendly reference code such as `A8F3K9`.
 * Ambiguous characters are excluded so it reads cleanly over the phone / QR.
 */
export function generateReferenceCode(length = 6): string {
  let out = "";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i++) {
    out += REFERENCE_ALPHABET[bytes[i] % REFERENCE_ALPHABET.length];
  }
  return out;
}
