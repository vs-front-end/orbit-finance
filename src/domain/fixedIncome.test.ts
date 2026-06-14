import { describe, expect, it } from 'vitest';

import {
  buildFixedIncomeView,
  cdiDailyRate,
  combineSummaryWithFixed,
  grossValueAfterDays,
  irRateForDays,
  sumFixedIncomeViews,
  type FixedIncomeView,
} from './fixedIncome';
import type { PLSummary } from './positions';
import type { FixedIncome } from './types';

describe('irRateForDays', () => {
  it('applies the regressive IR brackets at the boundaries', () => {
    expect(irRateForDays(180)).toBe(0.225);
    expect(irRateForDays(181)).toBe(0.2);
    expect(irRateForDays(360)).toBe(0.2);
    expect(irRateForDays(361)).toBe(0.175);
    expect(irRateForDays(720)).toBe(0.175);
    expect(irRateForDays(721)).toBe(0.15);
  });
});

describe('cdiDailyRate', () => {
  it('scales the daily CDI rate by the contracted percent', () => {
    const full = cdiDailyRate(0.1, 100);
    expect(full).toBeCloseTo(1.1 ** (1 / 252) - 1, 10);
    expect(cdiDailyRate(0.1, 110)).toBeCloseTo(full * 1.1, 10);
  });
});

describe('grossValueAfterDays', () => {
  it('compounds over business days (100% CDI over a year ≈ +CDI)', () => {
    // 365 calendar days -> round(252) business days -> back to the annual rate
    expect(grossValueAfterDays(1000, 0.1, 100, 365)).toBeCloseTo(1100, 6);
  });

  it('returns the principal for zero days', () => {
    expect(grossValueAfterDays(1000, 0.1, 100, 0)).toBe(1000);
  });
});

describe('buildFixedIncomeView', () => {
  it('derives gross value and yield from the current value', () => {
    const item: FixedIncome = {
      id: 'f1',
      portfolioId: 'p1',
      name: 'CDB Inter',
      principal: 1000,
      currentValue: 1080,
      cdiPercent: 110,
      appliedAt: '2026-01-01T00:00:00.000Z',
      maturesAt: null,
    };

    expect(buildFixedIncomeView(item)).toMatchObject({
      grossValue: 1080,
      yield: 80,
      dailyPL: 0,
    });
  });
});

function fixedView(
  principal: number,
  grossValue: number,
  dailyPL: number,
): FixedIncomeView {
  return {
    id: 'f',
    portfolioId: 'p',
    name: 'CDB',
    principal,
    currentValue: grossValue,
    cdiPercent: 100,
    appliedAt: '2026-01-01T00:00:00.000Z',
    maturesAt: null,
    grossValue,
    yield: grossValue - principal,
    dailyPL,
  };
}

describe('sumFixedIncomeViews', () => {
  it('totals principal, gross value and daily P/L', () => {
    expect(
      sumFixedIncomeViews([
        fixedView(1000, 1080, 5),
        fixedView(2000, 1900, -3),
      ]),
    ).toEqual({ principal: 3000, grossValue: 2980, dailyPL: 2 });
  });
});

describe('combineSummaryWithFixed', () => {
  const equity: PLSummary = {
    marketValue: 1200,
    investedValue: 1000,
    dailyPL: 100,
    dailyPLPercent: 0,
    netPL: 200,
    netPLPercent: 20,
    gains: 200,
    losses: 0,
  };

  it('folds fixed income gains into the portfolio summary', () => {
    const combined = combineSummaryWithFixed(equity, {
      principal: 1000,
      grossValue: 1080,
      dailyPL: 0,
    });

    expect(combined.marketValue).toBe(2280);
    expect(combined.investedValue).toBe(2000);
    expect(combined.netPL).toBe(280);
    expect(combined.netPLPercent).toBeCloseTo(14, 10);
    expect(combined.dailyPLPercent).toBeCloseTo(4.5872, 4);
    expect(combined.gains).toBe(280);
    expect(combined.losses).toBe(0);
  });

  it('routes a fixed income loss into losses, not gains', () => {
    const combined = combineSummaryWithFixed(equity, {
      principal: 1000,
      grossValue: 900,
      dailyPL: 0,
    });

    expect(combined.gains).toBe(200);
    expect(combined.losses).toBe(-100);
  });
});
