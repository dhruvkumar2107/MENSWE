// All money is stored as integer paise (INR minor units) to avoid floating
// point errors. These helpers convert and format for display.

export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function toRupees(paise: number): number {
  return paise / 100;
}

export function formatINR(paise: number, opts?: { compact?: boolean }): string {
  const value = paise / 100;
  if (opts?.compact && Math.abs(value) >= 100000) {
    return `₹${(value / 100000).toFixed(2)}L`;
  }
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function percentOff(price: number, salePrice?: number | null): number {
  if (!salePrice || salePrice >= price || price <= 0) return 0;
  return Math.round(((price - salePrice) / price) * 100);
}

// Tax is stored on products as basis points (500 = 5%). Prices are treated as
// tax-inclusive for display, and the tax component is derived from the total.
export function taxComponent(amountInclusive: number, rateBps: number): number {
  if (rateBps <= 0) return 0;
  const rate = rateBps / 10000;
  return Math.round((amountInclusive * rate) / (1 + rate));
}
