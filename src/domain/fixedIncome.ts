import type { FixedIncome } from './types';

export type FixedIncomeView = FixedIncome & {
  grossValue: number;
  yield: number;
  dailyPL: number;
};

const BUSINESS_DAYS_RATIO = 252 / 365;

export function irRateForDays(days: number): number {
  if (days <= 180) return 0.225;
  if (days <= 360) return 0.2;
  if (days <= 720) return 0.175;
  return 0.15;
}

export function cdiDailyRate(cdiAnnual: number, cdiPercent: number): number {
  return ((1 + cdiAnnual) ** (1 / 252) - 1) * (cdiPercent / 100);
}

export function grossValueAfterDays(
  principal: number,
  cdiAnnual: number,
  cdiPercent: number,
  days: number,
): number {
  const businessDays = Math.max(0, Math.round(days * BUSINESS_DAYS_RATIO));
  return principal * (1 + cdiDailyRate(cdiAnnual, cdiPercent)) ** businessDays;
}

export function buildFixedIncomeView(item: FixedIncome): FixedIncomeView {
  const grossValue = item.currentValue;

  return {
    ...item,
    grossValue,
    yield: grossValue - item.principal,
    dailyPL: 0,
  };
}
