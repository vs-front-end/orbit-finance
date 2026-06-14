import { describe, expect, it } from 'vitest';

import {
  accrueCdi,
  isFinancial,
  valuePatrimonyItem,
  type CdiRatePoint,
} from './patrimony';
import type { PatrimonyItem } from './types';

function item(overrides: Partial<PatrimonyItem>): PatrimonyItem {
  return {
    id: 'i1',
    name: 'Item',
    kind: 'cash',
    value: 1000,
    referenceDate: '2025-06-14',
    cdiPercent: null,
    annualRate: null,
    createdAt: '2025-06-14T00:00:00.000Z',
    ...overrides,
  };
}

const noSeries: CdiRatePoint[] = [];
const today = '2026-06-14';

describe('isFinancial', () => {
  it('treats cash and reserve as financial, property/vehicle as assets', () => {
    expect(isFinancial('cash')).toBe(true);
    expect(isFinancial('reserve')).toBe(true);
    expect(isFinancial('property')).toBe(false);
    expect(isFinancial('vehicle')).toBe(false);
  });
});

describe('accrueCdi', () => {
  it('compounds only the daily rates after the reference date', () => {
    const series: CdiRatePoint[] = [
      { date: '2026-06-01', daily: 0.0004 },
      { date: '2026-06-02', daily: 0.0004 },
      { date: '2026-06-03', daily: 0.0004 },
    ];
    expect(accrueCdi(1000, 100, series, '2026-06-01')).toBeCloseTo(
      1000 * 1.0004 ** 2,
      6,
    );
  });

  it('scales the rate by the contracted percent', () => {
    const series: CdiRatePoint[] = [{ date: '2026-06-02', daily: 0.001 }];
    expect(accrueCdi(1000, 110, series, '2026-06-01')).toBeCloseTo(
      1000 * (1 + 0.001 * 1.1),
      6,
    );
  });

  it('compounds each business day at its historical rate', () => {
    const series: CdiRatePoint[] = [
      { date: '2026-06-02', daily: 0.0005 },
      { date: '2026-06-03', daily: 0.0004 },
    ];
    expect(accrueCdi(1000, 100, series, '2026-06-01')).toBeCloseTo(
      1000 * 1.0005 * 1.0004,
      6,
    );
  });
});

describe('valuePatrimonyItem', () => {
  it('cash is static', () => {
    const result = valuePatrimonyItem(item({ kind: 'cash' }), noSeries, today);
    expect(result.current).toBe(1000);
    expect(result.gain).toBe(0);
  });

  it('reserve accrues by the CDI series', () => {
    const series: CdiRatePoint[] = [
      { date: '2025-12-01', daily: 0.0004 },
      { date: '2026-01-01', daily: 0.0004 },
    ];
    const result = valuePatrimonyItem(
      item({ kind: 'reserve', cdiPercent: 100 }),
      series,
      today,
    );
    expect(result.current).toBeCloseTo(1000 * 1.0004 ** 2, 6);
  });

  it('property appreciates by the annual rate', () => {
    const result = valuePatrimonyItem(
      item({ kind: 'property', annualRate: 10 }),
      noSeries,
      today,
    );
    expect(result.current).toBeCloseTo(1100, 0);
    expect(result.gain).toBeGreaterThan(0);
  });

  it('vehicle depreciates by the annual rate', () => {
    const result = valuePatrimonyItem(
      item({ kind: 'vehicle', annualRate: 20 }),
      noSeries,
      today,
    );
    expect(result.current).toBeCloseTo(800, 0);
    expect(result.gain).toBeLessThan(0);
  });
});
