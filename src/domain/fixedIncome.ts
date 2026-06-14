import type { PLSummary } from './positions';
import type { FixedIncome } from './types';

export type FixedIncomeView = FixedIncome & {
  grossValue: number;
  yield: number;
  dailyPL: number;
};

export type FixedIncomeTotals = {
  principal: number;
  grossValue: number;
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

export function sumFixedIncomeViews(
  views: FixedIncomeView[],
): FixedIncomeTotals {
  return views.reduce(
    (acc, view) => ({
      principal: acc.principal + view.principal,
      grossValue: acc.grossValue + view.grossValue,
      dailyPL: acc.dailyPL + view.dailyPL,
    }),
    { principal: 0, grossValue: 0, dailyPL: 0 },
  );
}

export function combineSummaryWithFixed(
  summary: PLSummary,
  fixed: FixedIncomeTotals,
): PLSummary {
  const marketValue = summary.marketValue + fixed.grossValue;
  const investedValue = summary.investedValue + fixed.principal;
  const dailyPL = summary.dailyPL + fixed.dailyPL;
  const netPL = marketValue - investedValue;
  const fixedNet = fixed.grossValue - fixed.principal;
  const previousValue = marketValue - dailyPL;

  return {
    marketValue,
    investedValue,
    dailyPL,
    dailyPLPercent: previousValue > 0 ? (dailyPL / previousValue) * 100 : 0,
    netPL,
    netPLPercent: investedValue > 0 ? (netPL / investedValue) * 100 : 0,
    gains: summary.gains + Math.max(0, fixedNet),
    losses: summary.losses + Math.min(0, fixedNet),
  };
}
