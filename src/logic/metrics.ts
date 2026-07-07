import type { Transaction } from '../types';

export interface PortfolioMetrics {
  portfolio: string;
  paidCount: number;
  excludedCount: number;
  totalInvested: number; // out-of-pocket contributions only (excludes distributions)
  totalWithdrawn: number;
  totalDistributions: number; // reinvested earnings — part of the gain, not the cost
  depositCount: number; // number of out-of-pocket 'in' flows
  unitsHeld: number;
  earliestUnitPrice: number | null;
  latestUnitPrice: number | null;
  earliestDate: string | null;
  latestDate: string | null;
  estimatedValue: number;
  netGain: number;
  simpleROI: number | null; // null when nothing invested
  avgCostPerUnit: number | null; // null when no units held
  unitPriceChange: number | null; // null when price history is degenerate
  xirr: number | null; // null when not computable
}

export interface SeriesPoint {
  date: string; // ISO yyyy-mm-dd (effectiveDate)
  unitPrice: number;
  cumulativeInvested: number;
  cumulativeUnits: number;
  portfolioValue: number; // running units × that row's unit price
}

const MS_PER_DAY = 86_400_000;

/** Whole-day difference between two ISO dates, measured in UTC. */
export function daysBetween(fromISO: string, toISO: string): number {
  const from = Date.parse(`${fromISO}T00:00:00Z`);
  const to = Date.parse(`${toISO}T00:00:00Z`);
  return (to - from) / MS_PER_DAY;
}

/** Rows that participate in the math: Paid only. */
export function paidTransactions(txns: Transaction[]): Transaction[] {
  return txns.filter((t) => t.status.toLowerCase() === 'paid');
}

function sortByEffective(txns: Transaction[]): Transaction[] {
  return [...txns].sort((a, b) =>
    a.effectiveDate < b.effectiveDate ? -1 : a.effectiveDate > b.effectiveDate ? 1 : 0,
  );
}

interface CashFlow {
  date: string;
  amount: number; // signed: negative = money out of pocket (investment)
}

/**
 * XIRR via bisection. Cash flows: each 'in' is -amount at its effectiveDate,
 * each 'out' is +amount, plus a terminal +estimatedValue at the latest date.
 * Returns null when the period is < 30 days or the flows don't bracket a root.
 */
export function xirr(flows: CashFlow[]): number | null {
  if (flows.length < 2) return null;

  const sorted = [...flows].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (!first || !last) return null;

  const spanDays = daysBetween(first.date, last.date);
  if (spanDays < 30) return null;

  const npv = (rate: number): number => {
    let sum = 0;
    for (const f of sorted) {
      const t = daysBetween(first.date, f.date) / 365;
      sum += f.amount / Math.pow(1 + rate, t);
    }
    return sum;
  };

  let lo = -0.99;
  let hi = 10;
  let fLo = npv(lo);
  let fHi = npv(hi);

  // The flows must bracket a root for bisection to converge.
  if (!Number.isFinite(fLo) || !Number.isFinite(fHi) || fLo * fHi > 0) return null;

  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npv(mid);
    if (fMid === 0) return mid;
    if (fLo * fMid < 0) {
      hi = mid;
      fHi = fMid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return (lo + hi) / 2;
}

/** Compute all metrics for one portfolio's Paid transactions plus excluded count. */
export function computePortfolioMetrics(
  portfolio: string,
  allTxns: Transaction[],
): PortfolioMetrics {
  const paid = paidTransactions(allTxns);
  const excludedCount = allTxns.length - paid.length;

  const ins = paid.filter((t) => t.direction === 'in');
  const outs = paid.filter((t) => t.direction === 'out');
  // Distributions issue units but cost nothing out of pocket: their units count
  // toward the holding, their dollars do NOT count as "invested".
  const contributions = ins.filter((t) => !t.isDistribution);

  const totalInvested = contributions.reduce((s, t) => s + t.amount, 0);
  const totalWithdrawn = outs.reduce((s, t) => s + t.amount, 0);
  const totalDistributions = ins.reduce((s, t) => s + (t.isDistribution ? t.amount : 0), 0);
  const unitsHeld = ins.reduce((s, t) => s + t.units, 0) - outs.reduce((s, t) => s + t.units, 0);

  const sorted = sortByEffective(paid);
  const earliest = sorted[0] ?? null;
  const latest = sorted[sorted.length - 1] ?? null;

  const earliestUnitPrice = earliest ? earliest.unitPrice : null;
  const latestUnitPrice = latest ? latest.unitPrice : null;

  const estimatedValue = latestUnitPrice !== null ? unitsHeld * latestUnitPrice : 0;
  const netGain = estimatedValue + totalWithdrawn - totalInvested;
  const simpleROI = totalInvested > 0 ? netGain / totalInvested : null;
  const avgCostPerUnit = unitsHeld !== 0 ? (totalInvested - totalWithdrawn) / unitsHeld : null;

  const unitPriceChange =
    earliestUnitPrice !== null && latestUnitPrice !== null && earliestUnitPrice !== 0
      ? latestUnitPrice / earliestUnitPrice - 1
      : null;

  // XIRR sees only external cash: contributions out of pocket and withdrawals.
  // Reinvested distributions are internal — their payoff shows up in the
  // terminal value through the extra units they bought.
  const flows: CashFlow[] = [
    ...contributions.map((t) => ({ date: t.effectiveDate, amount: -t.amount })),
    ...outs.map((t) => ({ date: t.effectiveDate, amount: t.amount })),
  ];
  if (latest) {
    flows.push({ date: latest.effectiveDate, amount: estimatedValue });
  }

  return {
    portfolio,
    paidCount: paid.length,
    excludedCount,
    totalInvested,
    totalWithdrawn,
    totalDistributions,
    depositCount: contributions.length,
    unitsHeld,
    earliestUnitPrice,
    latestUnitPrice,
    earliestDate: earliest ? earliest.effectiveDate : null,
    latestDate: latest ? latest.effectiveDate : null,
    estimatedValue,
    netGain,
    simpleROI,
    avgCostPerUnit,
    unitPriceChange,
    xirr: xirr(flows),
  };
}

/** Group by portfolio, then compute per-portfolio metrics and an overall roll-up. */
export function computeAll(txns: Transaction[]): {
  perPortfolio: PortfolioMetrics[];
  overall: PortfolioMetrics;
} {
  const byPortfolio = new Map<string, Transaction[]>();
  for (const t of txns) {
    const list = byPortfolio.get(t.portfolio) ?? [];
    list.push(t);
    byPortfolio.set(t.portfolio, list);
  }

  const perPortfolio = [...byPortfolio.entries()]
    .map(([name, list]) => computePortfolioMetrics(name, list))
    .sort((a, b) => (a.portfolio < b.portfolio ? -1 : 1));

  const overall = computePortfolioMetrics('All portfolios', txns);
  return { perPortfolio, overall };
}

/**
 * Time series for the charts: chronological Paid rows with cumulative invested,
 * cumulative units, and portfolio value (running units × that row's unit price).
 */
export function buildSeries(txns: Transaction[]): SeriesPoint[] {
  const sorted = sortByEffective(paidTransactions(txns));
  let cumulativeInvested = 0;
  let cumulativeUnits = 0;
  return sorted.map((t) => {
    if (t.direction === 'in') {
      cumulativeInvested += t.amount;
      cumulativeUnits += t.units;
    } else {
      cumulativeInvested -= t.amount; // withdrawal reduces net invested
      cumulativeUnits -= t.units;
    }
    return {
      date: t.effectiveDate,
      unitPrice: t.unitPrice,
      cumulativeInvested,
      cumulativeUnits,
      portfolioValue: cumulativeUnits * t.unitPrice,
    };
  });
}
