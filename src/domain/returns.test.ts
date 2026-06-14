import { describe, expect, it } from 'vitest';

import { timeWeightedReturn, type CashFlow } from './returns';

const noFlows: CashFlow[] = [];

describe('timeWeightedReturn', () => {
  it('returns null with fewer than 2 points', () => {
    expect(timeWeightedReturn([{ t: 1, value: 100 }], noFlows)).toBeNull();
  });

  it('is a plain return when there are no flows', () => {
    const points = [
      { t: 1, value: 100 },
      { t: 2, value: 110 },
    ];
    expect(timeWeightedReturn(points, noFlows)).toBeCloseTo(10, 6);
  });

  it('chains daily returns without flows', () => {
    const points = [
      { t: 1, value: 100 },
      { t: 2, value: 110 },
      { t: 3, value: 121 },
    ];
    expect(timeWeightedReturn(points, noFlows)).toBeCloseTo(21, 6);
  });

  it('removes the effect of a deposit in the period', () => {
    const points = [
      { t: 1, value: 100 },
      { t: 2, value: 210 },
    ];
    const flows: CashFlow[] = [{ t: 2, amount: 100 }];
    expect(timeWeightedReturn(points, flows)).toBeCloseTo(5, 6);
  });

  it('handles a withdrawal (negative flow)', () => {
    const points = [
      { t: 1, value: 100 },
      { t: 2, value: 55 },
    ];
    const flows: CashFlow[] = [{ t: 2, amount: -50 }];
    expect(timeWeightedReturn(points, flows)).toBeCloseTo(10, 6);
  });

  it('attributes a flow to the interval it falls in', () => {
    const points = [
      { t: 1, value: 100 },
      { t: 2, value: 110 },
      { t: 3, value: 231 },
    ];
    const flows: CashFlow[] = [{ t: 3, amount: 100 }];
    expect(timeWeightedReturn(points, flows)).toBeCloseTo(21, 6);
  });
});
