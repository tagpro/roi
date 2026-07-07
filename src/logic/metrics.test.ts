import { describe, it, expect } from 'vitest';
import spaceship from '../providers/spaceship';
import { spaceshipFixtureCsv } from '../fixtures/spaceshipFixture';
import {
  buildSeries,
  computeAll,
  computePortfolioMetrics,
  daysBetween,
  xirr,
} from './metrics';
import type { Transaction } from '../types';

const parsed = spaceship.parse(spaceshipFixtureCsv);
const { overall } = computeAll(parsed.transactions);

describe('computePortfolioMetrics against the validation fixture', () => {
  it('parses 52 transactions', () => {
    expect(parsed.transactions).toHaveLength(52);
    expect(overall.paidCount).toBe(52);
  });

  it('totals invested = 1500.00', () => {
    expect(overall.totalInvested).toBeCloseTo(1500.0, 2);
    expect(overall.totalWithdrawn).toBe(0);
  });

  it('units held ≈ 651.111047', () => {
    expect(overall.unitsHeld).toBeCloseTo(651.111047, 6);
  });

  it('latest unit price = 2.44 (effective 2026-06-30)', () => {
    expect(overall.latestUnitPrice).toBeCloseTo(2.44, 6);
    expect(overall.latestDate).toBe('2026-06-30');
    expect(overall.earliestDate).toBe('2025-07-08');
  });

  it('estimated value ≈ 1588.71', () => {
    expect(overall.estimatedValue).toBeCloseTo(1588.71, 1);
  });

  it('net gain ≈ +88.71', () => {
    expect(overall.netGain).toBeCloseTo(88.71, 1);
  });

  it('simple ROI ≈ +5.91%', () => {
    expect(overall.simpleROI).not.toBeNull();
    expect((overall.simpleROI as number) * 100).toBeCloseTo(5.91, 1);
  });

  it('unit price change ≈ -2.40%', () => {
    expect(overall.unitPriceChange).not.toBeNull();
    expect((overall.unitPriceChange as number) * 100).toBeCloseTo(-2.4, 1);
  });

  it('XIRR ≈ +12.35%', () => {
    expect(overall.xirr).not.toBeNull();
    expect((overall.xirr as number) * 100).toBeCloseTo(12.35, 1);
  });

  it('avg cost per unit is below the latest price (DCA bought cheaper units)', () => {
    expect(overall.avgCostPerUnit).not.toBeNull();
    expect(overall.avgCostPerUnit as number).toBeLessThan(overall.latestUnitPrice as number);
  });
});

describe('buildSeries', () => {
  it('produces one chronological point per paid row with monotonic invested', () => {
    const series = buildSeries(parsed.transactions);
    expect(series).toHaveLength(52);
    expect(series[0]!.date).toBe('2025-07-08');
    expect(series[series.length - 1]!.date).toBe('2026-06-30');
    expect(series[series.length - 1]!.cumulativeInvested).toBeCloseTo(1500, 2);
    expect(series[series.length - 1]!.cumulativeUnits).toBeCloseTo(651.111047, 6);
    // portfolio value at the end == units * latest price
    expect(series[series.length - 1]!.portfolioValue).toBeCloseTo(1588.71, 1);
  });
});

describe('daysBetween', () => {
  it('counts whole days across a month', () => {
    expect(daysBetween('2025-07-08', '2025-08-08')).toBe(31);
    expect(daysBetween('2026-06-30', '2025-07-08')).toBe(-357);
  });
});

function tx(over: Partial<Transaction>): Transaction {
  return {
    transactionDate: '2025-01-01',
    effectiveDate: '2025-01-01',
    type: 'buy',
    status: 'Paid',
    amount: 100,
    units: 50,
    unitPrice: 2,
    direction: 'in',
    isDistribution: false,
    portfolio: 'P',
    ...over,
  };
}

describe('xirr edge cases', () => {
  it('returns null when the period is < 30 days', () => {
    const flows = [
      { date: '2025-01-01', amount: -100 },
      { date: '2025-01-10', amount: 105 },
    ];
    expect(xirr(flows)).toBeNull();
  });

  it('returns null when flows do not bracket a root (all outflows)', () => {
    const flows = [
      { date: '2025-01-01', amount: -100 },
      { date: '2025-06-01', amount: -50 },
    ];
    expect(xirr(flows)).toBeNull();
  });

  it('recovers a known ~10% annual return', () => {
    // Invest 1000, one year later worth 1100 -> 10% XIRR.
    const flows = [
      { date: '2025-01-01', amount: -1000 },
      { date: '2026-01-01', amount: 1100 },
    ];
    const r = xirr(flows);
    expect(r).not.toBeNull();
    expect(r as number).toBeCloseTo(0.1, 3);
  });
});

describe('withdrawals and multi-portfolio roll-up', () => {
  it('subtracts withdrawn units and money from holdings', () => {
    const txns: Transaction[] = [
      tx({ effectiveDate: '2025-01-01', amount: 200, units: 100, unitPrice: 2, direction: 'in' }),
      tx({ effectiveDate: '2025-06-01', amount: 60, units: 20, unitPrice: 3, direction: 'out' }),
      tx({ effectiveDate: '2025-12-01', amount: 0, units: 0, unitPrice: 4, direction: 'in' }),
    ];
    const m = computePortfolioMetrics('P', txns);
    expect(m.totalInvested).toBe(200);
    expect(m.totalWithdrawn).toBe(60);
    expect(m.unitsHeld).toBe(80); // 100 - 20
    expect(m.latestUnitPrice).toBe(4);
    expect(m.estimatedValue).toBe(320); // 80 * 4
    expect(m.netGain).toBe(180); // 320 + 60 - 200
  });

  it('counts distribution units in the holding but not in invested or XIRR flows', () => {
    const txns: Transaction[] = [
      tx({ effectiveDate: '2025-01-01', amount: 200, units: 100, unitPrice: 2, direction: 'in' }),
      tx({
        effectiveDate: '2025-07-01',
        amount: 20,
        units: 10,
        unitPrice: 2,
        direction: 'in',
        isDistribution: true,
      }),
      tx({ effectiveDate: '2026-01-01', amount: 220, units: 100, unitPrice: 2.2, direction: 'in' }),
    ];
    const m = computePortfolioMetrics('P', txns);
    expect(m.totalInvested).toBe(420); // distribution's $20 excluded
    expect(m.totalDistributions).toBe(20);
    expect(m.depositCount).toBe(2);
    expect(m.unitsHeld).toBe(210); // distribution's units included
    expect(m.estimatedValue).toBeCloseTo(210 * 2.2, 6);
    // The distribution shows up as gain: 462 - 420 = 42, of which 20 was the
    // reinvested distribution and 22 was price appreciation.
    expect(m.netGain).toBeCloseTo(42, 6);
    // XIRR must beat the pure price return because of the distribution.
    expect(m.xirr).not.toBeNull();
  });

  it('rolls up multiple portfolios and reports each separately', () => {
    const txns: Transaction[] = [
      tx({ portfolio: 'A', amount: 100, units: 50, unitPrice: 2 }),
      tx({ portfolio: 'B', amount: 200, units: 50, unitPrice: 4, effectiveDate: '2025-03-01' }),
    ];
    const { perPortfolio, overall } = computeAll(txns);
    expect(perPortfolio.map((p) => p.portfolio)).toEqual(['A', 'B']);
    expect(overall.totalInvested).toBe(300);
    expect(overall.unitsHeld).toBe(100);
  });
});
