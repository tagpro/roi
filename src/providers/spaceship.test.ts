import { describe, it, expect } from 'vitest';
import spaceship, { directionFromUnitChangeType } from './spaceship';
import { ParseError } from '../types';
import { spaceshipFixtureCsv } from '../fixtures/spaceshipFixture';

const HEADER =
  'Transaction Date,Transaction Type,Status,Amount,Units,Unit Price,Unit Change Type,Effective Date,Portfolio';

describe('spaceship parser — happy path', () => {
  it('parses the fixture into 52 normalized transactions with no warnings', () => {
    const { transactions, warnings } = spaceship.parse(spaceshipFixtureCsv);
    expect(transactions).toHaveLength(52);
    expect(warnings).toHaveLength(0);
    const first = transactions[0]!;
    expect(first.direction).toBe('in');
    expect(first.portfolio).toBe('Spaceship Universe Portfolio');
    expect(typeof first.amount).toBe('number');
    expect(first.status).toBe('Paid');
  });
});

describe('spaceship parser — header validation', () => {
  it('throws a friendly ParseError naming the missing column', () => {
    const badHeader =
      'Transaction Date,Transaction Type,Status,Amount,Units,Unit Price,Effective Date,Portfolio';
    const csv = `${badHeader}\n2025-01-01,buy,Paid,20,7,2.8,2025-01-02,P`;
    expect(() => spaceship.parse(csv)).toThrow(ParseError);
    try {
      spaceship.parse(csv);
    } catch (e) {
      expect((e as Error).message).toContain('Unit Change Type');
    }
  });

  it('throws on an empty file', () => {
    expect(() => spaceship.parse('   ')).toThrow(ParseError);
  });
});

describe('spaceship parser — row handling', () => {
  it('collects a warning (does not throw) for an unparseable amount', () => {
    const csv = [
      HEADER,
      '2025-07-08,Investment plan (weekly),Paid,notanumber,7.3,2.72,Units issued,2025-07-09,P',
      '2025-07-15,Investment plan (weekly),Paid,20.00,7.4,2.70,Units issued,2025-07-16,P',
    ].join('\n');
    const { transactions, warnings } = spaceship.parse(csv);
    expect(transactions).toHaveLength(1);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]!.message).toMatch(/unparseable/i);
  });

  it('skips blank lines without warnings', () => {
    const csv = [
      HEADER,
      '',
      '2025-07-15,Investment plan (weekly),Paid,20.00,7.4,2.70,Units issued,2025-07-16,P',
      '   ',
    ].join('\n');
    const { transactions, warnings } = spaceship.parse(csv);
    expect(transactions).toHaveLength(1);
    expect(warnings).toHaveLength(0);
  });

  it('marks redemption rows as direction "out"', () => {
    const csv = [
      HEADER,
      '2025-07-08,Investment plan (weekly),Paid,20.00,7.3,2.72,Units issued,2025-07-09,P',
      '2026-01-01,Withdrawal,Paid,50.00,18.0,2.77,Units redeemed,2026-01-02,P',
    ].join('\n');
    const { transactions } = spaceship.parse(csv);
    expect(transactions).toHaveLength(2);
    expect(transactions[1]!.direction).toBe('out');
  });

  it('normalizes negative units on withdrawals (real export format) to positive + out', () => {
    // Spaceship exports redemptions with NEGATIVE units.
    const csv = [
      HEADER,
      '2023-11-12,Withdrawal,Paid,1500.00,-1458.101455,1.028735,Units redeemed,2023-11-14,P',
    ].join('\n');
    const { transactions } = spaceship.parse(csv);
    expect(transactions).toHaveLength(1);
    expect(transactions[0]!.direction).toBe('out');
    expect(transactions[0]!.units).toBeCloseTo(1458.101455, 6);
    expect(transactions[0]!.amount).toBe(1500);
  });

  it('treats negative units as "out" even when Unit Change Type says issued', () => {
    const csv = [
      HEADER,
      '2023-11-12,Adjustment,Paid,10.00,-5.0,2.0,Units issued,2023-11-13,P',
    ].join('\n');
    const { transactions } = spaceship.parse(csv);
    expect(transactions[0]!.direction).toBe('out');
    expect(transactions[0]!.units).toBe(5);
  });

  it('flags Distribution rows and keeps them as units in', () => {
    const csv = [
      HEADER,
      '2026-07-02,Distribution,Paid,13.60,7.772325,1.750055,Units issued,2026-07-02,P',
      '2026-07-01,Investment plan (weekly),Paid,25.00,14.187834,1.762073,Units issued,2026-07-02,P',
    ].join('\n');
    const { transactions } = spaceship.parse(csv);
    expect(transactions[0]!.isDistribution).toBe(true);
    expect(transactions[0]!.direction).toBe('in');
    expect(transactions[1]!.isDistribution).toBe(false);
  });

  it('warns on an unrecognised Unit Change Type', () => {
    const csv = [
      HEADER,
      '2025-07-08,Fee,Paid,1.00,0,0,Mystery adjustment,2025-07-09,P',
    ].join('\n');
    const { transactions, warnings } = spaceship.parse(csv);
    expect(transactions).toHaveLength(0);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]!.message).toMatch(/unrecognised/i);
  });
});

describe('spaceship parser — multi-portfolio', () => {
  it('keeps distinct portfolios on each row', () => {
    const csv = [
      HEADER,
      '2025-07-08,Investment plan (weekly),Paid,20.00,7.3,2.72,Units issued,2025-07-09,Universe',
      '2025-07-08,Investment plan (weekly),Paid,20.00,6.9,2.90,Units issued,2025-07-09,Earth',
    ].join('\n');
    const { transactions } = spaceship.parse(csv);
    expect(new Set(transactions.map((t) => t.portfolio))).toEqual(new Set(['Universe', 'Earth']));
  });
});

describe('directionFromUnitChangeType', () => {
  it('maps issued to in, redeem/cancel to out, unknown to null', () => {
    expect(directionFromUnitChangeType('Units issued')).toBe('in');
    expect(directionFromUnitChangeType('Units redeemed')).toBe('out');
    expect(directionFromUnitChangeType('Order cancelled')).toBe('out');
    expect(directionFromUnitChangeType('something else')).toBeNull();
  });
});
