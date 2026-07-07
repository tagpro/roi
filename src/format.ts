// Locale-aware formatting. AUD currency (2dp), percentages (2dp), units (4dp).

const currencyFmt = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const unitsFmt = new Intl.NumberFormat('en-AU', {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

const priceFmt = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

export function formatCurrency(value: number): string {
  return currencyFmt.format(value);
}

/** Signed currency, e.g. "+$3.25" / "-$10.00". */
export function formatSignedCurrency(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${currencyFmt.format(Math.abs(value))}`;
}

export function formatUnits(value: number): string {
  return unitsFmt.format(value);
}

export function formatPrice(value: number): string {
  return priceFmt.format(value);
}

/** Fraction (0.0591) -> "5.91%". */
export function formatPercent(fraction: number): string {
  return `${(fraction * 100).toFixed(2)}%`;
}

/** Signed fraction (0.0591) -> "+5.91%". */
export function formatSignedPercent(fraction: number): string {
  const pct = fraction * 100;
  const sign = pct > 0 ? '+' : pct < 0 ? '-' : '';
  return `${sign}${Math.abs(pct).toFixed(2)}%`;
}
