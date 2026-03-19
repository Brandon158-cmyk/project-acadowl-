// Format a number as Zambian Kwacha (ZMW)
export function formatZMW(amount: number): string {
  return new Intl.NumberFormat('en-ZM', {
    style: 'currency',
    currency: 'ZMW',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format a number as compact ZMW (e.g., K1.2M)
export function formatZMWCompact(amount: number): string {
  if (amount >= 1_000_000) {
    return `K${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `K${(amount / 1_000).toFixed(1)}K`;
  }
  return `K${amount.toFixed(2)}`;
}
