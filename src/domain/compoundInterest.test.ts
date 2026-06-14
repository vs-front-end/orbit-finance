import { describe, expect, it } from 'vitest';

import { buildCompoundSchedule, toMonthlyRate } from './compoundInterest';

describe('toMonthlyRate', () => {
  it('converts an annual rate to its equivalent monthly rate', () => {
    expect(toMonthlyRate(0.12, 'yearly')).toBeCloseTo(1.12 ** (1 / 12) - 1, 10);
  });

  it('keeps a monthly rate unchanged', () => {
    expect(toMonthlyRate(0.01, 'monthly')).toBe(0.01);
  });
});

describe('buildCompoundSchedule', () => {
  it('returns no rows for a zero-month horizon', () => {
    const schedule = buildCompoundSchedule({
      initialAmount: 1000,
      monthlyAmount: 100,
      monthlyRate: 0.01,
      months: 0,
    });

    expect(schedule.rows).toHaveLength(0);
    expect(schedule.balance).toBe(1000);
    expect(schedule.invested).toBe(1000);
    expect(schedule.totalInterest).toBe(0);
  });

  it('compounds the initial amount without contributions', () => {
    const schedule = buildCompoundSchedule({
      initialAmount: 1000,
      monthlyAmount: 0,
      monthlyRate: 0.01,
      months: 2,
    });

    expect(schedule.balance).toBeCloseTo(1020.1, 10);
    expect(schedule.invested).toBe(1000);
    expect(schedule.totalInterest).toBeCloseTo(20.1, 10);
  });

  it('only yields on contributions from the following month', () => {
    const schedule = buildCompoundSchedule({
      initialAmount: 0,
      monthlyAmount: 100,
      monthlyRate: 0.1,
      months: 2,
    });

    // month 0: contribution made after close -> no interest yet
    expect(schedule.rows[0]).toMatchObject({ balance: 0, interest: 0 });
    // month 1: the first contribution now yields 10
    expect(schedule.rows[1]).toMatchObject({ balance: 110, interest: 10 });
    expect(schedule.invested).toBe(200);
    expect(schedule.totalInterest).toBeCloseTo(10, 10);
  });
});
