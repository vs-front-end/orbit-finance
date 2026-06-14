import { describe, expect, it } from 'vitest';

import { buildRebalancePlan } from './rebalance';

describe('buildRebalancePlan', () => {
  it('computes current/target allocation and the contribution delta', () => {
    const plan = buildRebalancePlan(
      [
        { id: 'a', valueBRL: 7000, targetPercent: 50 },
        { id: 'b', valueBRL: 3000, targetPercent: 50 },
      ],
      0,
    );

    expect(plan.currentTotal).toBe(10000);
    expect(plan.plannedTotal).toBe(10000);
    expect(plan.targetSum).toBe(100);

    const [a, b] = plan.rows;
    expect(a).toMatchObject({
      currentPercent: 70,
      targetValue: 5000,
      diff: -2000,
    });
    expect(b).toMatchObject({
      currentPercent: 30,
      targetValue: 5000,
      diff: 2000,
    });
  });

  it('spreads an extra contribution across the planned total', () => {
    const plan = buildRebalancePlan(
      [
        { id: 'a', valueBRL: 5000, targetPercent: 60 },
        { id: 'b', valueBRL: 5000, targetPercent: 40 },
      ],
      2000,
    );

    expect(plan.plannedTotal).toBe(12000);
    // target value is a share of the planned total, not the current one
    expect(plan.rows[0].targetValue).toBeCloseTo(7200, 6);
    expect(plan.rows[0].diff).toBeCloseTo(2200, 6);
    expect(plan.rows[1].targetValue).toBeCloseTo(4800, 6);
    expect(plan.rows[1].diff).toBeCloseTo(-200, 6);
  });

  it('guards against an empty portfolio (no division by zero)', () => {
    const plan = buildRebalancePlan(
      [{ id: 'a', valueBRL: 0, targetPercent: 100 }],
      0,
    );

    expect(plan.currentTotal).toBe(0);
    expect(plan.rows[0].currentPercent).toBe(0);
    expect(plan.rows[0].diff).toBe(0);
  });
});
