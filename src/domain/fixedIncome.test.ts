import { describe, expect, it } from 'vitest';

import {
  cdiDailyRate,
  grossValueAfterDays,
  irRateForDays,
} from './fixedIncome';

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
    expect(grossValueAfterDays(1000, 0.1, 100, 365)).toBeCloseTo(1100, 6);
  });

  it('returns the principal for zero days', () => {
    expect(grossValueAfterDays(1000, 0.1, 100, 0)).toBe(1000);
  });
});
