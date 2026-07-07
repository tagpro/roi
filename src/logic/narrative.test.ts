import { describe, it, expect } from 'vitest';
import { generateNarrative } from './narrative';
import type { PortfolioMetrics } from './metrics';

function metrics(over: Partial<PortfolioMetrics>): PortfolioMetrics {
  return {
    portfolio: 'P',
    paidCount: 10,
    excludedCount: 0,
    totalInvested: 1000,
    totalWithdrawn: 0,
    depositCount: 10,
    unitsHeld: 400,
    earliestUnitPrice: 2.5,
    latestUnitPrice: 2.5,
    earliestDate: '2025-01-01',
    latestDate: '2025-12-31',
    estimatedValue: 1000,
    netGain: 0,
    simpleROI: 0,
    avgCostPerUnit: 2.5,
    unitPriceChange: 0,
    xirr: 0,
    ...over,
  };
}

describe('narrative headline tone', () => {
  it('says gain when ROI is clearly positive', () => {
    const s = generateNarrative(metrics({ netGain: 200, simpleROI: 0.2, estimatedValue: 1200 }));
    expect(s[0]).toMatch(/gain of/i);
    expect(s[0]).not.toMatch(/roughly flat/i);
  });

  it('says loss when ROI is clearly negative', () => {
    const s = generateNarrative(metrics({ netGain: -200, simpleROI: -0.2, estimatedValue: 800 }));
    expect(s[0]).toMatch(/loss of/i);
  });

  it('says roughly flat when |ROI| < 0.5%', () => {
    const s = generateNarrative(metrics({ netGain: 2.1, simpleROI: 0.0021, estimatedValue: 1002.1 }));
    expect(s[0]).toMatch(/roughly flat/i);
  });
});

describe('narrative annualised sentence', () => {
  it('includes XIRR when present', () => {
    const s = generateNarrative(metrics({ xirr: 0.0812 }));
    expect(s.some((x) => /money-weighted \(XIRR\)/.test(x))).toBe(true);
  });

  it('omits the annualised sentence when XIRR is null', () => {
    const s = generateNarrative(metrics({ xirr: null }));
    expect(s.some((x) => /XIRR/.test(x))).toBe(false);
  });
});

describe('narrative price-vs-DCA branches', () => {
  it('price fell but ROI >= 0 -> DCA kept it positive', () => {
    const s = generateNarrative(metrics({ unitPriceChange: -0.031, simpleROI: 0.0021 }));
    expect(s.some((x) => /fell .* dollar-cost averaging .* kept your overall return positive/i.test(x))).toBe(
      true,
    );
  });

  it('price fell and ROI < 0 -> softened the drop', () => {
    const s = generateNarrative(metrics({ unitPriceChange: -0.2, simpleROI: -0.1 }));
    expect(s.some((x) => /softened the drop/i.test(x))).toBe(true);
  });

  it('price rose and ROI >= 0 -> steady buying left return positive', () => {
    const s = generateNarrative(metrics({ unitPriceChange: 0.2, simpleROI: 0.15 }));
    expect(s.some((x) => /rose .* return positive/i.test(x))).toBe(true);
  });

  it('price rose but ROI < 0 -> bought high', () => {
    const s = generateNarrative(metrics({ unitPriceChange: 0.1, simpleROI: -0.05 }));
    expect(s.some((x) => /Even though the unit price rose/i.test(x))).toBe(true);
  });
});

describe('narrative structure', () => {
  it('always includes the cost-basis line and the estimate caveat, 3–5 sentences', () => {
    const s = generateNarrative(metrics({ netGain: 200, simpleROI: 0.2 }));
    expect(s.length).toBeGreaterThanOrEqual(3);
    expect(s.length).toBeLessThanOrEqual(5);
    expect(s.some((x) => /average cost per unit/i.test(x))).toBe(true);
    expect(s[s.length - 1]).toMatch(/not a live valuation/i);
  });
});
